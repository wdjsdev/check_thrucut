/*

	Version: 2.002
		11 October, 2016
		Updated inner recursive function to check for compound paths that have a thru-cut stroke.	

	Version: 2.003
		11 October, 2016
		Fixed bug wherein a compound path item may have no child pathItems. Ignored the item in this case.


*/
#target Illustrator
function thruCutCheck ()
{
	var valid = true;
	var scriptName = "check_thru_cut";

	function getUtilities ()
	{
		var utilNames = [ "Utilities_Container" ]; //array of util names
		var utilFiles = []; //array of util files
		//check for dev mode
		var devUtilitiesPreferenceFile = File( "~/Documents/script_preferences/dev_utilities.txt" );
		function readDevPref ( dp ) { dp.open( "r" ); var contents = dp.read() || ""; dp.close(); return contents; }
		if ( devUtilitiesPreferenceFile.exists && readDevPref( devUtilitiesPreferenceFile ).match( /true/i ) )
		{
			$.writeln( "///////\n////////\nUsing dev utilities\n///////\n////////" );
			var devUtilPath = "~/Desktop/automation/utilities/";
			utilFiles = [ devUtilPath + "Utilities_Container.js", devUtilPath + "Batch_Framework.js" ];
			return utilFiles;
		}

		var dataResourcePath = customizationPath + "Library/Scripts/Script_Resources/Data/";

		for ( var u = 0; u < utilNames.length; u++ )
		{
			var utilFile = new File( dataResourcePath + utilNames[ u ] + ".jsxbin" );
			if ( utilFile.exists )
			{
				utilFiles.push( utilFile );
			}

		}

		if ( !utilFiles.length )
		{
			alert( "Could not find utilities. Please ensure you're connected to the appropriate Customization drive." );
			return [];
		}


		return utilFiles;

	}
	var utilities = getUtilities();

	for ( var u = 0, len = utilities.length; u < len && valid; u++ )
	{
		eval( "#include \"" + utilities[ u ] + "\"" );
	}

	if ( !valid || !utilities.length ) return;

	DEV_LOGGING = user === "will.dowling";

	function innerRecursive ( gatheredPaths, group )
	{
		for ( var i = 0; i < group.pageItems.length; i++ )
		{
			var thisPageItem = group.pageItems[ i ];
			if ( thisPageItem.typename == 'PathItem' || ( thisPageItem.typename == 'CompoundPathItem' &&
				thisPageItem.pathItems.length > 0 &&
				thisPageItem.pathItems[ 0 ].stroked &&
				thisPageItem.pathItems[ 0 ].strokeColor.spot &&
				thisPageItem.pathItems[ 0 ].strokeColor.spot.name == 'Thru-cut' ) )
			{
				gatheredPaths.push( thisPageItem );
				if ( thisPageItem.typename == 'PathItem' && thisPageItem.filled == true && thisPageItem.fillColor.spot && thisPageItem.fillColor.spot.name == 'Thru-cut' )
				{
					hasFills++;
					return;
				}

			}
			// else if(thisPageItem.typename == 'CompoundPathItem')
			// {	
			// 	if(thisPageItem.pathItems[0].stroked == true && thisPageItem.pathItems[0].strokeColor.spot.name == 'Thru-cut')
			// 	{
			// 		gatheredPaths.push(thisPageItem);
			// 	}
			// }
			else if ( thisPageItem.typename == 'GroupItem' )
			{

				innerRecursive( gatheredPaths, thisPageItem );
			}
		}
	}

	function outerRecursive ( group )
	{
		var gatheredPaths = [];
		innerRecursive( gatheredPaths, group );
		for ( var i = 0; i < gatheredPaths.length; i++ )
		{
			var thisPath = gatheredPaths[ i ];
			if ( this.path.filled && thisPath.fillColor.spot && thisPath.fillColor.spot.name == 'Thru-cut' )
			{
				alert( "You have Thru-cut fills in your document." );
				return;
			}
			if ( thisPath.stroked && thisPath.strokeColor.spot && thisPath.strokeColor.spot.name == 'Thru-cut' )
			{
				tCCounter++;
				break;
			}
			if ( thisPath.typename == "CompoundPathItem" )
			{
				if ( thisPath.pathItems[ 0 ].stroked && thisPath.pathItems[ 0 ].strokeColor.spot.name == 'Thru-cut' )
				{
					tCCounter++;
					break;
				}
			}
		}
	}

	function setThruCutOpacity ()
	{
		try
		{
			var doc = app.activeDocument;
			var thruCutSwatch = makeNewSpotColor( "Thru-cut", "CMYK",
				{
					c: 0,
					m: 0,
					y: 0,
					k: 0
				} );
			doc.selection = null;
			doc.defaultStrokeColor = thruCutSwatch.color;
			app.executeMenuCommand( "Find Stroke Color menu item" );
			setZeroOpacity( doc.selection );

			function setZeroOpacity ( selection )
			{
				for ( var x = 0, len = selection.length; x < len; x++ )
				{
					selection[ x ].opacity = 0;
				}
			}
		}
		catch ( e )
		{
			alert( "e = " + e + "\non line: " + e.line );
		}
	}

	function missingThruCutHighlight ()
	{


		function innerRecursive ( gatheredPaths, group )
		{
			for ( var i = 0; i < group.pageItems.length; i++ )
			{
				var thisPageItem = group.pageItems[ i ];
				if ( thisPageItem.typename == 'PathItem' )
				{
					gatheredPaths.push( thisPageItem );

				}

				else if ( thisPageItem.typename == 'CompoundPathItem' )
				{
					if ( thisPageItem.pathItems[ 0 ].stroked &&
						thisPageItem.pathItems[ 0 ].strokeColor.spot &&
						thisPageItem.pathItems[ 0 ].strokeColor.spot.name == 'Thru-cut' )
					{
						gatheredPaths.push( thisPageItem );
					}
				}

				else if ( thisPageItem.typename == 'GroupItem' )
				{

					innerRecursive( gatheredPaths, thisPageItem );
				}
			}
		}

		function outerRecursive ( group )
		{
			var gatheredPaths = [];
			innerRecursive( gatheredPaths, group );
			for ( var i = 0; i < gatheredPaths.length; i++ )
			{
				var thisPath = gatheredPaths[ i ];
				if ( ( thisPath.stroked && thisPath.strokeColor.spot && thisPath.strokeColor.spot.name == 'Thru-cut' ) || ( thisPath.typename == 'CompoundPathItem' && thisPath.pathItems[ 0 ].strokeColor.spot.name == 'Thru-cut' ) )
				{
					highLight.push( thisPath );
				}
			}
		}

		if ( app.documents.length > 0 )
		{
			var doc = app.activeDocument;
			var aB = doc.artboards;
			var groups = doc.layers[ 0 ].groupItems.length;
			var highLight = [];
			if ( groups > 0 )
			{
				for ( var g = 0; g < groups; g++ )
				{
					var myGroup = doc.layers[ 0 ].groupItems[ g ];
					outerRecursive( myGroup );
				}
			}

			var red;
			if ( doc.documentColorSpace == "[DocumentColorSpace.CMYK]" )
			{
				red = new CMYKColor();
				red.cyan = 0;
				red.magenta = 0;
				red.yellow = 0;
				red.black = 0;
			}
			else
			{
				red = new RGBColor();
				red.red = 255;
				red.green = 0;
				red.blue = 0;
			}
			doc.layers[ 0 ].visible = false;
			var highLightLayer = doc.layers.add();
			highLightLayer.name = "Highlight Layer";
			for ( d = 0; d < highLight.length; d++ )
			{
				if ( highLight[ d ].typename == 'CompoundPathItem' )
				{
					var copied = highLight[ d ].duplicate( app.activeDocument.layers[ 0 ], ElementPlacement.PLACEATBEGINNING );
					copied.pathItems[ 0 ].clipping = false;
					copied.pathItems[ 0 ].filled = false;
					copied.pathItems[ 0 ].stroked = true;
					copied.pathItems[ 0 ].strokeColor = red;
					copied.pathItems[ 0 ].strokeWidth = 4;
				}
				else
				{
					var copied = highLight[ d ].duplicate( app.activeDocument.layers[ 0 ], ElementPlacement.PLACEATBEGINNING );
					copied.clipping = false;
					copied.filled = false;
					copied.stroked = true;
					copied.strokeColor = red;
					copied.strokeWidth = 4;
				}
			} // end for loop D
		}

	}



	if ( app.documents.length > 0 )
	{
		var doc = app.activeDocument;
		var layers = doc.layers;
		var aB = doc.artboards;
		var groups = doc.layers[ 0 ].groupItems.length;
		var tCCounter = 0;
		var hasFills = 0;



		if ( groups > 0 )
		{
			for ( var g = 0; g < groups; g++ )
			{
				var myGroup = doc.layers[ 0 ].groupItems[ g ];
				outerRecursive( myGroup );
			}
			if ( aB.length > tCCounter )
			{
				alert( "You are missing at least 1 Thru-cut line." );
				missingThruCutHighlight();
			}
			else if ( hasFills > 0 )
			{
				alert( "There are Thru-cut fills in the document!" + '\n' + "Please fix Thru-cut lines and re-run this script" );
			}
			else
			{
				setThruCutOpacity();


				alert( "Thru-cut lines ok." );
			}
		}
	}
}
thruCutCheck();

