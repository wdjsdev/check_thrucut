﻿#target illustrator-18/*	Version: 2.002		11 October, 2016		Updated inner recursive function to check for compound paths that have a thru-cut stroke.	*/function thruCutCheck(){			function innerRecursive(gatheredPaths, group){		for(var i=0; i<group.pageItems.length; i++){			var thisPageItem = group.pageItems[i];			if(thisPageItem.typename == 'PathItem' || (thisPageItem.typename == 'CompoundPathItem' && thisPageItem.pathItems[0].stroked && thisPageItem.pathItems[0].strokeColor.spot.name == 'Thru-cut')){				gatheredPaths.push(thisPageItem);				if(thisPageItem.typename == 'PathItem' && thisPageItem.filled == true && thisPageItem.fillColor.spot && thisPageItem.fillColor.spot.name == 'Thru-cut'){					hasFills++;					return;					}			   			} 			// else if(thisPageItem.typename == 'CompoundPathItem')			// {				// 	if(thisPageItem.pathItems[0].stroked == true && thisPageItem.pathItems[0].strokeColor.spot.name == 'Thru-cut')			// 	{			// 		gatheredPaths.push(thisPageItem);			// 	}			// }			else if(thisPageItem.typename == 'GroupItem'){								innerRecursive(gatheredPaths, thisPageItem);			}		}	}	function outerRecursive(group){		var gatheredPaths = [];		innerRecursive(gatheredPaths, group);		for(var i=0; i<gatheredPaths.length; i++){			var thisPath = gatheredPaths[i];			if(this.path.filled && thisPath.fillColor.spot && thisPath.fillColor.spot.name == 'Thru-cut'){				alert("You have Thru-cut fills in your document.");				return;				}			if(thisPath.stroked && thisPath.strokeColor.spot && thisPath.strokeColor.spot.name == 'Thru-cut'){				tCCounter++;			   break;			}			if(thisPath.typename == "CompoundPathItem")			{				if (thisPath.pathItems[0].stroked && thisPath.pathItems[0].strokeColor.spot.name == 'Thru-cut')				{					tCCounter++;					break;				}			}		}	}	if(app.documents.length > 0){		var doc = app.activeDocument;		var layers = doc.layers;		var aB = doc.artboards;   		var groups = doc.layers[0].groupItems.length;		var tCCounter = 0;		var hasFills = 0;							if(groups > 0){			for(var g=0; g<groups; g++){				var myGroup = doc.layers[0].groupItems[g];				outerRecursive(myGroup);			}		if (aB.length > tCCounter){			alert("You are missing at least 1 Thru-cut line.");			missingThruCutHighlight();			}		else if (hasFills > 0){			alert("There are Thru-cut fills in the document!" + '\n' + "Please fix Thru-cut lines and re-run this script");			}		else{			alert("Thru-cut lines ok.");			}		}	}}thruCutCheck();function missingThruCutHighlight(){			function innerRecursive(gatheredPaths, group){		for(var i=0; i<group.pageItems.length; i++){			var thisPageItem = group.pageItems[i];			if(thisPageItem.typename == 'PathItem'){				gatheredPaths.push(thisPageItem);			   			} 			else if(thisPageItem.typename == 'CompoundPathItem')			{				if(thisPageItem.pathItems[0].stroked && thisPageItem.pathItems[0].strokeColor.spot.name == 'Thru-cut')				{					gatheredPaths.push(thisPageItem);				}			}			else if(thisPageItem.typename == 'GroupItem'){								innerRecursive(gatheredPaths, thisPageItem);			}		}	}	function outerRecursive(group){		var gatheredPaths = [];		innerRecursive(gatheredPaths, group);		for(var i=0; i<gatheredPaths.length; i++){			var thisPath = gatheredPaths[i];			if((thisPath.stroked && thisPath.strokeColor.spot && thisPath.strokeColor.spot.name == 'Thru-cut') || (thisPath.typename == 'CompoundPathItem' && thisPath.pathItems[0].strokeColor.spot.name == 'Thru-cut')){				highLight.push(thisPath);			}		}	}	if(app.documents.length > 0){		var doc = app.activeDocument;		var aB = doc.artboards;   		var groups = doc.layers[0].groupItems.length;		var highLight = [];		if(groups > 0){			for(var g=0; g<groups; g++){				var myGroup = doc.layers[0].groupItems[g];				outerRecursive(myGroup);			}		}				var red;		if(doc.documentColorSpace == "[DocumentColorSpace.CMYK]"){			red = new CMYKColor();			red.cyan = 0;			red.magenta = 0;			red.yellow = 0;			red.black = 0;		} else {			red = new RGBColor();			red.red = 255;			red.green = 0;			red.blue = 0;		}		doc.layers[0].visible = false;		var highLightLayer = doc.layers.add();		highLightLayer.name = "Highlight Layer";		for(d=0; d < highLight.length; d++){			if(highLight[d].typename == 'CompoundPathItem')			{				var copied = highLight[d].duplicate(app.activeDocument.layers[0], ElementPlacement.PLACEATBEGINNING);				copied.pathItems[0].clipping = false;				copied.pathItems[0].filled = false;				copied.pathItems[0].stroked = true;				copied.pathItems[0].strokeColor = red;				copied.pathItems[0].strokeWidth = 4;			}			else			{				var copied = highLight[d].duplicate(app.activeDocument.layers[0], ElementPlacement.PLACEATBEGINNING);				copied.clipping = false;				copied.filled = false;				copied.stroked = true;				copied.strokeColor = red;				copied.strokeWidth = 4;			}		} // end for loop D	}	}