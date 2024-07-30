//Flag functions

function setFlag(cat, index, value) {
    var flags = localStorage.getItem(cat);
    flags = flags.substring(0, index) + value + flags.substring(index + 1);
    localStorage.setItem(cat, flags);
}

function getFlag(cat, index) {
    return localStorage.getItem(cat)[index] == '1';
}
function getFlagAsNumber(cat, index) {
    return parseInt(localStorage.getItem(cat)[index]);
}
function getFlagAsCharCode(cat, index) {
    return localStorage.getItem(cat)[index].charCodeAt(0);
}

//Classes
//Leaflet Extended Classes
var Check = L.Marker.extend({
    initialize: function(latLng, icon, id, cat, index, van, reqs, info) {
        this._latlng = L.latLng(latLng);
        L.setOptions(this, {icon: icon, riseOnHover: true, keyboard: false});
        this.id = id;
        this.cat = cat;
        this.index = index;
        this.van = van;
        this.reqs = reqs;
        this.info = info;
        this.on('contextmenu', this.setAsMarked);
        this.on('click', this.showDetails);
    },
    set: function(val) {
        setFlag(this.cat, this.index, val);
    },
    isSet: function() {
        return getFlag(this.cat, this.index);
    },
    isMarked: function() {
        return this.isSet();
    },
    setAsMarked: function() {
        this.setOpacity(0.7);
        this.setZIndexOffset(-1000);
        this.off('contextmenu', this.setAsMarked);
        this.on('contextmenu', this.setAsUnmarked);
        this.set('1');
    },
    setAsUnmarked: function() {
        this.setOpacity(1);
        this.setZIndexOffset(0);
        this.off('contextmenu', this.setAsUnmarked);
        this.on('contextmenu', this.setAsMarked);
        this.set('0');
    },
    isShown: function() {
        return this.categoryIsVisible() && (this.isAvailable() || !getFlag('settings', 15));
    },
    isNotObtained: function() {
        return this.isShown() && !this.isSet();
    },
    categoryIsVisible: function() {
        return visibleCategories.includes(this.cat);
    },
    isAvailable: function() {
        if (!getFlag('settings', 14) || this.reqs == undefined)
            return true;
        for (let i = 0; i < this.reqs.length; ++i) {
            if (this.reqs[i].length == undefined) {
                if (!obtainedItems.includes(this.reqs[i])) 
                    return false
            }
            else {
                let alternativesNotMet = true;
                for (let j = 0; j < this.reqs[i].length; ++j) {
                    if(obtainedItems.includes(this.reqs[i][j])) {
                        alternativesNotMet = false;
                        break;
                    }
                }
                if (alternativesNotMet) 
                    return false;
            }
        }
        return true;
    },
    load: function() {
        if (!this.categoryIsVisible()) //If Check's Category isn't visible
            return false;
        let isNotAvailable = !this.isAvailable();
        if (isNotAvailable && getFlag('settings', 15)) //Hide Checks Without Reqs
                return false;
        if (getFlag('settings', 12) && this.van != undefined) { //Show Chests as Base Content
            let temp = this.options.icon;
            L.setOptions(this, {icon: this.van});
            this.addTo(map);
            L.setOptions(this, {icon: temp});
        } 
        else
            this.addTo(map);
        if (isNotAvailable) { // Show Check as Non-Obtainable
            this._icon.style.filter = 'grayscale(1) contrast(125%)';
            this.setZIndexOffset(-500);
        }
        if(this.isSet())
            this.setAsMarked();
        return true;
       
    },
    showDetails: function() {
        var box = document.getElementById('check');
        box.style.visibility = "visible";
        box.style.width = "25%";
        box.style.height = "100%";
        if (this.van != undefined) {
            document.getElementById('van').style.display = "block";
            document.getElementById('vandiv').innerHTML = this.iconToImg(this.van, 
                this.van.options.className == undefined ? this.van.options.iconUrl.slice(6, -4) : this.van.options.className, "iti");
        }
        else 
            document.getElementById('van').style.display = "none";
        if (this.reqs != undefined) {
            document.getElementById('reqs').style.display = "block";
            let rdHtml = "";
            for (let i = 0; i < this.reqs.length; ++i) {
                if (this.reqs[i].length != undefined) {
                    rdHtml += '<div class="oritems"><div class="oritf"><p class="idot">•</p>' + this.iconToImg(this.reqs[i][0].mapIcon, this.reqs[i][0].name, "iti") + '</div>';
                    for(let j = 1; j < this.reqs[i].length; ++j) {
                        rdHtml += '<div class="orits"><p class="por">or</p>' + this.iconToImg(this.reqs[i][j].mapIcon, this.reqs[i][j].name, "itis") + '</div>';
                    }
                    rdHtml += '</div>';
                }
                else {
                    rdHtml += '<div class="item"><p class="idot">•</p>' + this.iconToImg(this.reqs[i].mapIcon, this.reqs[i].name, "iti") + '</div>';
                }
            }
            document.getElementById('reqsdiv').innerHTML = rdHtml;
        }
        else 
            document.getElementById('reqs').style.display = "none";
        document.getElementById('cinfo').style.visibility = "visible";
        document.getElementById('cinfodiv').innerHTML = this.info;
        map.on('click', hideDetails);
    },
    iconToImg: function(icon, name, imgClass) {
          return '<img class="ii ' + imgClass + '" src="' + icon.options.iconUrl + '">' +
                '<p class="itp">' + name + '</p>';
    }
});

var FakeCheck = Check.extend({
    initialize: function(latLng, icon, index, reqs, info) {
        this._latlng = L.latLng(latLng);
        L.setOptions(this, {icon: icon, riseOnHover: true, keyboard: false});
        this.index = index;
        this.reqs = reqs;
        this.info = info;
        this.cat = 'fake';
        this.on('contextmenu', this.setAsMarked);
        this.on('click', this.showDetails);
    },
    isMarked: function() {
        return true;
    },
    isShown: function() {
        return false;
    }
});

var NonCheck = L.Marker.extend({
    initialize: function(latLng, icon, cat) {
        this._latlng = L.latLng(latLng);
        L.setOptions(this, {icon: icon, riseOnHover: true, keyboard: false});
        this.cat = cat;
    },
    load: function() {
        return;
        this.addTo(map);
    },
    isSet: function() {
        return true;
    },
    isMarked: function() {
        return true;
    },
    isShown: function() {
        return false;
    },
    setAsMarked: function() {
        return;
    },
    setAsUnmarked: function() {
        return;
    },
    isNotObtained: function() {
        return false;
    }
});

var Submap = L.Marker.extend({
    initialize: function(latLng, icon, imageLink, imageSize, checks) {
        this._latlng = L.latLng(latLng);
        L.setOptions(this, {icon: icon, riseOnHover: true});
        this.icon = icon;
        this.checks = checks;  
        if (imageSize[1] > 330) {
            imageSize[0] = 330 / imageSize[1] * imageSize[0];
            imageSize[1] = 330;
        }   
        this.image = L.imageOverlay('Submaps/' + imageLink, 
            [[latLng[0] + imageSize[1], latLng[1] - imageSize[0]], [latLng[0] - imageSize[1], latLng[1] + imageSize[0]]]);
        this.on('click', this.load);
        this.on('contextmenu', this.mark);
    }, 

    setAsMarked: function() {
        this.setOpacity(0.7);
        this.setZIndexOffset(-1000);
        if (getFlag('settings', 13))
            this.setIcon(this.icon);
        this.off('contextmenu', this.mark);
        this.on('contextmenu', this.unmark);
    },
    setAsUnmarked: function() {
        this.setOpacity(1);
        this.setZIndexOffset(0);
        if (getFlag('settings', 13))
            this.showCounter();
        this.off('contextmenu', this.unmark);
        this.on('contextmenu', this.mark);
    },
    mark: function() {        
        for (let i = 0; i < this.checks.length; ++i) {
            if (this.checks[i].isShown())
                this.checks[i].setAsMarked();
        }
        this.setAsMarked();
    },
    unmark: function() {     
        for (let i = 0; i < this.checks.length; ++i) {
            if (this.checks[i].isShown())
                this.checks[i].setAsUnmarked();
        }
        this.setAsUnmarked();
    },

    isMarked: function() {
        for (let i = 0; i < this.checks.length; ++i) {
            if (!this.checks[i].isMarked()) {
                return false;
            }              
        }
        return true;
    },

    loadIcon: function() {
        if (!(getFlag('settings', 11))) {
            let notVisible = true;
            for (let i = 0; i < this.checks.length; ++i) {
                if (this.checks[i].isShown()) {
                    notVisible = false;
                    break;
                }     
            }    
            if (notVisible)
                return;     
        }       
        if (this.isMarked()) {
            this.addTo(map);
            this.setAsMarked(); 
        }         
        else if (getFlag('settings', 13)) {
           this.showCounter();
           this.setAsUnmarked();
        } 
        else {
            this.addTo(map);
            this.setAsUnmarked();
        }
    },       

    load: function() {
        loadSubmap(this._latlng);
        loadedDungeon = this;
        this.image.addTo(map);
        this.loadChecks();      
    },
    loadChecks: function() {
        for(let i = 0; i < this.checks.length; ++i) 
            this.checks[i].load();
    },
    showCounter: function() {
        this.remove();
        let temp = this.icon;
        L.setOptions(this, {icon: getCounterIcon(this.icon, this.getCounterAmount())});
        this.addTo(map);
        L.setOptions(this, {icon: temp});
    },
    getCounterAmount: function() {
        let cpt = 0;
        for(let i = 0; i < this.checks.length; ++i) {
            cpt += this.checks[i].isNotObtained() ? 1 : 0;
        }
        return cpt;
    }
}); 

var DungeonFloor = L.ImageOverlay.extend({
    initialize: function(img, bounds, checks) {
        this._url = img;
		this._bounds = L.latLngBounds(bounds);
        this.checks = checks;
    },
    load: function() {
        this.addTo(map);
        this.loadChecks();
        if (mapState == 4)
            return;
        let nwp = this._bounds.getNorthWest();
        let sep = this._bounds.getSouthEast();
        setTimeout(function() {
            map.setMaxBounds(L.latLngBounds([[nwp.lat + 300, nwp.lng - 500], [sep.lat - 300, sep.lng + 300]]));
        }, 200);        
    },
    hasShownChecks: function () {
        let visible = false;
        for (let i = 0; i < this.checks.length; ++i) {
            if (this.checks[i].isShown()) {
                visible = true;
                break;
            }     
        }  
        return visible; 
    },
    loadChecks : function() {
        for(let i = 0; i < this.checks.length; ++i) 
            this.checks[i].load();
    },
    set: function() {
        for (let i = 0; i < this.checks.length; ++i) {
            if (this.checks[i].isShown())
                this.checks[i].setAsMarked();
        }         
    },
    unset: function() {
        for (let i = 0; i < this.checks.length; ++i) {
            if (this.checks[i].isShown())
                this.checks[i].setAsUnmarked();
        }
    },
    isMarked: function() {
        for (let i = 0; i < this.checks.length; ++i) {
            if (!this.checks[i].isMarked()) 
                return false;               
        }
        return true;
    },
    getCounterAmount: function() {
        let cpt = 0;
        for(let i = 0; i < this.checks.length; ++i) {
            cpt += this.checks[i].isNotObtained() ? 1 : 0;
        }
        return cpt;
    }

});

var Dungeon = Submap.extend({
    initialize: function(latLngTile, latLngMain, icon, name, floors) {
        L.setOptions(this, {icon: icon, riseOnHover: true});
        this.latLngTile = L.latLng(latLngTile);
        this.latLngMain = L.latLng(latLngMain);;
        this.icon = icon;
        for(let i = 0; i < floors.length; ++i) {
            if (floors[i][0][1] > 1350) {
                floors[i][0][0] = 1350 / floors[i][0][1] * floors[i][0][0];
                floors[i][0][1] = 1350;
            }
            floors[i] = new DungeonFloor('Dungeons/' + name + '/' + (i + 1) + 'F.png', 
                [[-4913 + floors[i][0][1], 4258 - floors[i][0][0]], [-4913 - floors[i][0][1], 4258 + floors[i][0][0]]],
                floors[i][1]);
        }
        this.floors = floors;   
        this.on('click', this.load);
        this.on('contextmenu', this.mark);
    }, 
    mark: function() {
        for (let i = 0; i < this.floors.length; ++i) {
            this.floors[i].set();
        }
        this.setAsMarked();
    },
    unmark: function() {
        for (let i = 0; i < this.floors.length; ++i) {
            this.floors[i].unset();
        }
        this.setAsUnmarked();
    },

    isMarked: function() {
        for (let i = 0; i < this.floors.length; ++i) {
            if (!this.floors[i].isMarked()) 
                return false;                     
        }
        return true;
    },
    loadIcon: function() {
        if (!getFlag('settings', 11)) {
            let notVisible = true;
            for (let i = 0; i < this.floors.length; ++i) {
                if (this.floors[i].hasShownChecks()) {
                    notVisible = false;
                    break;
                }     
            }    
            if (notVisible)
                return;     
        }
        if (mapState == 0) 
            this._latlng = this.latLngMain;
        else 
            this._latlng = this.latLngTile;
        if (this.isMarked()) {
            this.addTo(map);
            this.setAsMarked(); 
        }         
        else if (getFlag('settings', 13)) {
            this.showCounter();
            this.setAsUnmarked();
        } 
        else {
            this.addTo(map);
            this.setAsUnmarked();
        }   
    },
    load: function() { 
        if (mapState == 0) {
            map.setMinZoom(-5);
            document.getElementById('made').style.display = 'none';
            map.off('zoomend');
            map.dragging.enable();         
            map.on('zoomend', dezoomToMainMap);  
        }
        loadedDungeon = this.floors;
        document.getElementById('dun').style.display = 'inline'
        dn.src = this.floors[0]._url.slice(0, -6) + "Name.png";
        dn.style.display = 'flex';
        this.floors[0].load();
        mapState = 2;
        removeAllLayers();
        map.setView([-4913, 4258], -2);
        window.addEventListener('keydown', dungeonControls);
        map.on('zoomend', exitDungeon);
        resetFloorButtons();
        for(let i = 0; i < this.floors.length; ++i) {
            let floor = document.getElementById('F' + (i + 1));
            floor.style.display = 'flex';
        }
        document.getElementById('F1').click();
    },
    getCounterAmount: function() {
        let cpt = 0;
        for(let i = 0; i < this.floors.length; ++i) {
            cpt += this.floors[i].getCounterAmount();
        }
        return cpt;
    }
});

var FlooredSubmap = Dungeon.extend({
    initialize: function(latLng, icon, img, floors) {
        this._latlng = L.latLng(latLng);
        L.setOptions(this, {icon: icon, riseOnHover: true});
        this.icon = icon;
        for (let i = 0; i < floors.length; ++i) {
            if (floors[i][0][1] > 330) {
                floors[i][0][0] = 330 / floors[i][0][1] * floors[i][0][0];
                floors[i][0][1] = 330;
            }
            floors[i] = new DungeonFloor('Submaps/' + img + i + '.png', 
            [[latLng[0] + floors[i][0][1], latLng[1] - floors[i][0][0]], [latLng[0] - floors[i][0][1], latLng[1] + floors[i][0][0]]],
            floors[i][1]);
        }
        this.floors = floors;
        this.on('click', this.load);
        this.on('contextmenu', this.mark);
    }, 
    loadIcon: function() {
        if (!getFlag('settings', 11)) {
            let notVisible = true;
            for (let i = 0; i < this.floors.length; ++i) {
                if (this.floors[i].hasShownChecks()) {
                    notVisible = false;
                    break;
                }     
            }    
            if (notVisible)
                return;     
        }
        if (this.isMarked()) {
            this.addTo(map);
            this.setAsMarked(); 
        }         
        else if (getFlag('settings', 13)) {
            this.showCounter();
            this.setAsUnmarked();
        } 
        else {
            this.addTo(map);
            this.setAsUnmarked();
        }   
    },
    load: function() {
        loadSubmap(this._latlng);
        mapState = 4;
        loadedDungeon = this.floors;  
        document.getElementById('dun').style.display = 'inline'
        resetFloorButtons();
        for(let i = 0; i < this.floors.length; ++i) {
            let floor = document.getElementById('F' + (i + 1));
            floor.style.display = 'flex';
        }
        document.getElementById('F1').click();
        window.addEventListener('keydown', dungeonControls);
    },
});


// Simple Classes
class Province {
    constructor(polyPoints, isCastle, counterPos, checkIds) {
        this.poly = L.polygon(polyPoints, { fillColor: '#6e5b1e', fillOpacity: 0, opacity: 0});
        this.isCastle = isCastle;
        this.checkIds = checkIds;
        this.counterPos = counterPos;
        this.poly.on('mouseover', this.highlight);
        this.poly.on('mouseout', this.unhighlight);
        if (this.isCastle)
            this.poly.on('click', function() { 
                submaps[submaps.length - 1].load();
            });
        else
            this.poly.on('click', zoomOnClick);
    }
    highlight() {
        this.setStyle({ fillOpacity: 0.5 });
    }
    unhighlight() {
        this.setStyle({ fillOpacity: 0 });
    }
    load() {
        this.poly.addTo(map);
        this.poly.setStyle({ fillOpacity: 0 });
        if (getFlag('settings', 13)) {
            L.marker(this.counterPos, {
                icon: L.divIcon({ html: '<div class="sccp">' + this.getCounterAmount() + '</div>'}),
                interactive: false
            }).addTo(map);
        }
    }
    getCounterAmount() {
        if (this.isCastle) 
            return submaps[submaps.length - 1].getCounterAmount();
        let cpt = 0;
        for(let i = 0; i < this.checkIds.length; ++i) {
            let id = this.checkIds[i];
            if (id < 500)
                cpt += checks[id].isNotObtained() ? 1 : 0;
            else 
                cpt += submaps[id - 500].getCounterAmount();
        }
        return cpt;
    }
}
class TrackerItem {
    constructor(elem, type, max, items) {
        this.elem = elem;
        this.type = type;
        this.max = max;
        this.items = items;
        this.state = 0;
    } 
}
class Item {
    constructor(name, mapIcon, trackerIcon) {
       this.name = name;
       this.mapIcon = mapIcon;
       this.trackerIcon = trackerIcon;
    } 
}

function createIcon(img, width, height, name) {
    return L.icon({iconUrl: 'Icons/' + img + '.png', iconSize: [width, height],
                   className: name}); 
}
function bI(img, isMale) { // Create bug icon
    return L.icon({iconUrl: 'Icons/' + img + (isMale ? 'M' : 'F') + '.png',
        iconSize: [55, 55], className: (isMale ? '♂' : '♀') + ' ' + img});
}
//Icons
//General Map
var cI = L.icon({iconUrl: 'Icons/Chest.png', iconSize: [60, 52]}); 
var sCI = L.icon({iconUrl: 'Icons/ChestSmall.png', iconSize: [60, 52]});
var bCI = createIcon('ChestBoss', 55, 47.7);
var golWolfI = createIcon('Golden Wolf', 50.1, 55);
var grottoI = L.icon({iconUrl: 'Icons/Grotto.png', iconSize: [45, 45]});
var orDoorI = L.icon({iconUrl: 'Icons/Ordon Door.png', iconSize: [43.7, 55]});
var caveEI = L.icon({iconUrl: 'Icons/CaveEntrance.png', iconSize: [55, 46.2]});
var starI = L.icon({iconUrl: 'Icons/Star.png', iconSize: [50, 50]});
var mirI = L.icon({iconUrl: 'Icons/Mirror.png', iconSize: [55, 55]});
var castleI = L.icon({iconUrl: 'Icons/Castle.png', iconSize: [49.3, 55]});
//Non Checks
var horseGI = L.icon({iconUrl: 'Icons/Horse Grass.png', iconSize: [45.7, 55]});
var hawkGI = L.icon({iconUrl: 'Icons/Hawk Grass.png', iconSize: [31.3, 55]});
var fairyI = createIcon('FairyBottle', 34.3, 55);

//Obtainables
var hPI = L.icon({iconUrl:'Icons/Heart Piece.png', iconSize: [55, 43]});
var hCI = L.icon({iconUrl:'Icons/Heart Container.png', iconSize: [55, 43]});
var soulI = L.icon({iconUrl: 'Icons/Soul.png', iconSize: [50, 48]});
var smaKeyI = L.icon({iconUrl: 'Icons/Small Key.png', iconSize: [28.9, 55]});
var bossKeyI = createIcon('Boss Key', 32.5, 55);
var mapI = L.icon({iconUrl: 'Icons/Dungeon Map.png', iconSize: [50, 42]});
var compaI = createIcon('Compass', 55, 55);
var fusShaI = createIcon('Fused Shadow0', 51.9, 55);
var shardI = L.icon({iconUrl: 'Icons/Shard.png', iconSize: [50, 47.4]});
var gRI = L.icon({iconUrl: 'Icons/Green Rupee.png', iconSize: [35, 55]}); 
var bRI = L.icon({iconUrl: 'Icons/Blue Rupee.png', iconSize: [35, 55]});
var yRI = L.icon({iconUrl: 'Icons/Yellow Rupee.png', iconSize: [35, 55]});
var rRI = L.icon({iconUrl: 'Icons/Red Rupee.png', iconSize: [35, 55]}); 
var pRI = L.icon({iconUrl: 'Icons/Purple Rupee.png', iconSize: [35, 55]}); 
var oRI = L.icon({iconUrl: 'Icons/Orange Rupee.png', iconSize: [35, 55]}); 
var sRI = L.icon({iconUrl: 'Icons/Silver Rupee.png', iconSize: [35, 55]}); 
//Item Icons
var wooSwoI = createIcon('Sword0', 35.7, 55, 'Wooden Sword');
var ordSwoI = createIcon('Sword1', 35.5, 55);
var ordShieI = createIcon('Shield0', 49.3, 55);
var bottleI = L.icon({iconUrl: 'Icons/Bottle0.png', iconSize: [33.9, 55]});
var gBI = L.icon({iconUrl: 'Icons/Gale Boomerang.png', iconSize: [36, 60]});
var bACI = L.icon({iconUrl: 'Icons/Ball And Chain.png', iconSize: [60, 56]});
var ooccooI = L.icon({iconUrl: 'Icons/Ooccoo.png', iconSize: [46.5, 50]});
var lockI = L.icon({iconUrl: 'Icons/Lock.png', iconSize: [40, 40]});
var clawI = L.icon({iconUrl: 'Icons/Clawshot.png', iconSize: [49, 50]});
var dclawI = L.icon({iconUrl: 'Icons/ClawshotD.png', iconSize: [55, 51.1]})
var shaCryI = L.icon({iconUrl: 'Icons/Shadow Crystal.png', iconSize: [29, 60]});
//Tracker Icons
var frI = L.icon({iconUrl: 'Icons/Fishing Rod0.png', iconSize: [24, 55]});
var freI = L.icon({iconUrl: 'Icons/Fishing Rod1.png', iconSize: [24, 55]});
var slI = L.icon({iconUrl: 'Icons/Slingshot.png', iconSize: [35.6, 55]});
var laI = L.icon({iconUrl: 'Icons/Lantern.png', iconSize: [28.3, 55]});
var gaboI = L.icon({iconUrl: 'Icons/Boomerang.png', iconSize: [27.5, 55]});
var iBI = L.icon({iconUrl: 'Icons/Iron Boots.png', iconSize: [55, 55]});
var boI = L.icon({iconUrl: 'Icons/Bow.png', iconSize: [55, 55]});
var bBI = L.icon({iconUrl: 'Icons/Bomb Bag.png', iconSize: [40.7, 55]});
var claI = L.icon({iconUrl: 'Icons/Clawshot0.png', iconSize: [39.3, 55]});
var doclaI = L.icon({iconUrl: 'Icons/Clawshot1.png', iconSize: [55, 43.7]});
var spinI = L.icon({iconUrl: 'Icons/Spinner.png', iconSize: [39.3, 55]});
var balChaI = L.icon({iconUrl: 'Icons/Ball and Chain0.png', iconSize: [39.3, 55]});
var reddomI =  L.icon({iconUrl: 'Icons/Dominion Rod0.png', iconSize: [34.3, 55]});
var domI =  L.icon({iconUrl: 'Icons/Dominion Rod1.png', iconSize: [34.3, 55]});
var walI = L.icon({iconUrl: 'Icons/Wallet0.png', iconSize: [32.8, 55]});
var walbigI = L.icon({iconUrl: 'Icons/Wallet1.png', iconSize: [35.9, 55]});
var walgiI = L.icon({iconUrl: 'Icons/Wallet2.png', iconSize: [42.2, 55]});

// Items
var fishingRod = new Item('Fishing Rod', frI, frI);
var fishingRodCE = new Item('Fishing Rod + Earring', freI, freI);
var slingshot = new Item('Slingshot', slI, slI);
var lantern = new Item('Lantern', laI, laI);
var boomerang = new Item('Gale Boomerang', gBI, gaboI);
var ironBoots = new Item('Iron Boots', iBI, iBI);
var bow = new Item("Hero's Bow", boI, boI);
var bombBag = new Item('Bomb Bag', bBI, bBI);
var clawshot = new Item('Clawshot', clawI, claI);
var doubleClawshot = new Item('Double Clawshots', dclawI, doclaI);
var spinner = new Item('Spinner', spinI, spinI);
var ballAndChain = new Item('Ball and Chain', bACI, balChaI);
var redDominionRod = new Item('Powerless Dominion Rod', reddomI, reddomI);
var dominionRod = new Item('Dominion Rod', domI, domI);
var shadowCrystal = new Item('Shadow Crystal', shaCryI, shaCryI);
var woodenSword = new Item('Wooden Sword', wooSwoI, wooSwoI);
var wallet = new Item('Wallet', walI, walI);
var bigWallet = new Item('Big Wallet', walbigI, walbigI);
var giantWallet = new Item('Giant Wallet', walgiI, walgiI);




//Global variables
var visibleCategories = [];
var trackerItems = [];
var obtainedItems = [];
var provinces = [];
var mapState;
var settings;
var checks;
var submaps;
var TL;
var loadedDungeon;
var activeFloor;
var map;
var dn;
// var mainPopup;
// var dungeonPopup;
// var visMainPop = true;
// var visDunPop = true;



document.addEventListener("DOMContentLoaded", function() {
    console.time('Start');

    //Loading Local Storage
    if(localStorage.getItem("tracker") == null) {
        localStorage.setItem('base', // 400 checks
        "00000000000000000000000000000000000000000000000000" + 
        "00000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000" +
        "00000000000000000000000000000000000000000000000000"); 
        localStorage.setItem('poes', '000000000000000000000000000000000000000000000000000000000000'); // 60 checks
        localStorage.setItem('gifts', '000000000000000000000000000000000000000000000000000000000'); // 57 checks
        localStorage.setItem('bugs', '000000000000000000000000'); // 24 checks
        localStorage.setItem('skills', '0000000'); // 7 checks
        localStorage.setItem('skyc', '000000'); // 6 checks
        localStorage.setItem('shop', '0000'); // 4 checks
        localStorage.setItem('fake', '0000000000000000000000000000000000000000000000000000000000'); // 58 flags
        localStorage.setItem('settings', '111111111111011111111111111111111111111111111111111111111111'); // 60 flags
        localStorage.setItem('tracker', '0000000000000000000000010\0\0' + '0\0' + '00000000000000000000000000000'); // 59 flags
    }


    //Loading Settings
    var setche = document.getElementById('setche');
    setche.addEventListener('click', function () {
        if (settings[0].checked) {
            let allUnchecked = true;
            for (let i = 1; i < 8; ++i)
                allUnchecked = allUnchecked && !settings[i].checked;
            if (allUnchecked) {
                setFlag('settings', 0, '0');
                settings[0].checked = false;
            }
                
        }
        else {
            for (let i = 1; i < 8; ++i)
                if (settings[i].checked) {
                    settings[0].checked = true;
                    setFlag('settings', 0, '1');
                    break;
                }
        } 
        if (settings[8].checked) {
            let allUnchecked = true;
            for (let i = 9; i < 11; ++i)
                allUnchecked = allUnchecked && !settings[i].checked;
            if (allUnchecked) {
                setFlag('settings', 8, '0');
                settings[8].checked = false;
            }
                
        }
        else {
            for (let i = 9; i < 11; ++i)
                if (settings[i].checked) {
                    settings[8].checked = true;
                    setFlag('settings', 8, '1');
                    break;
                }
        }         
    })
    var settingsFlags = localStorage.getItem('settings');
    settings = document.querySelectorAll("input[type='checkbox']");
    settings[0].addEventListener('click', function() {
        if (this.checked) {
            setFlag('settings', 0, '1');
            for (let i = 1; i < 8; ++i) {
                settings[i].click();
            }          
        }
        else {
            setFlag('settings', 0, '0');
            for (let i = 1; i < 8; ++i) {
                if (settings[i].checked)
                    settings[i].click();
            }
        }
    });
    settings[1].addEventListener('click', function() {iconSet('base', 1)});
    settings[2].addEventListener('click', function() {iconSet('poes', 2)});
    settings[3].addEventListener('click', function() {iconSet('bugs', 3)});
    settings[4].addEventListener('click', function() {iconSet('gifts', 4)});
    settings[5].addEventListener('click', function() {iconSet('skyc', 5)});
    settings[6].addEventListener('click', function() {iconSet('skills', 6)});
    settings[7].addEventListener('click', function() {iconSet('shop', 7)});
    settings[8].addEventListener('click', function() {
        if (this.checked) {
            setFlag('settings', 8, '1');
            for (let i = 9; i < 11; ++i) {
                settings[i].click();
            }          
        }
        else {
            setFlag('settings', 8, '0');
            for (let i = 9; i < 11; ++i) {
                if (settings[i].checked)
                    settings[i].click();
            }
        }
    });
    settings[9].addEventListener('click', function() {iconSet('fake', 9)});
    settings[10].addEventListener('click', function() {iconSet('doors', 10)});
    settings[11].addEventListener('click', function() {
        setFlag('settings', 11, settings[11].checked ? '1': '0'); 
        reloadIcons();
    });
    settings[12].addEventListener('click', function() {
        setFlag('settings', 12, settings[12].checked ? '1': '0'); 
        reloadIcons();
    });
    settings[13].addEventListener('click', function() {
        setFlag('settings', 13, settings[13].checked ? '1': '0'); 
        reloadIcons();
    });
    settings[14].addEventListener('click', function() {
        setFlag('settings', 14, settings[14].checked ? '1': '0');
        reloadIcons();
    });
    settings[15].addEventListener('click', function() {
        setFlag('settings', 15, settings[15].checked ? '1': '0'); 
        reloadIcons();
    });
    settings[16].addEventListener('click', function() {
        setFlag('settings', 16, settings[16].checked ? '1': '0'); 
    });

    //Loading Tracker
    var t = document.getElementsByClassName('titem');
    for (let i = 0; i < t.length; ++i) {
        t[i].addEventListener('click', function() {increaseState(i)});
        t[i].addEventListener('contextmenu', function() {decreaseState(i)});
    }
    trackerItems[0] = new TrackerItem(t[0], 2, 2, [fishingRod, fishingRodCE]); // Fishing Rods
    trackerItems[1] = new TrackerItem(t[1], 0, 1, slingshot); // Slingshot
    trackerItems[2] = new TrackerItem(t[2], 0, 1, lantern); // Lantern
    trackerItems[3] = new TrackerItem(t[3], 0, 1, boomerang); // Boomerang
    trackerItems[4] = new TrackerItem(t[4], 0, 1, ironBoots);  // Iron Boots
    trackerItems[5] = new TrackerItem(t[5], 1, 3, bow); // Bow
    trackerItems[6] = new TrackerItem(t[6], 0, 1) // Hawkeye
    trackerItems[7] = new TrackerItem(t[7], 3, 3, bombBag); // Bomb Bags
    trackerItems[8] = new TrackerItem(t[8], 0, 1); // Big Bomb Bag
    trackerItems[9] = new TrackerItem(t[9], 2, 2, [clawshot, doubleClawshot]); // Clawshots
    trackerItems[10] = new TrackerItem(t[10], 0, 1, spinner); // Spinner
    trackerItems[11] = new TrackerItem(t[11], 0, 1, ballAndChain); // Ball and Chain
    trackerItems[12] = new TrackerItem(t[12], 2, 2, [redDominionRod, dominionRod]); // Dominion Rod
    trackerItems[13] = new TrackerItem(t[13], 0, 1); // Horse Call
    trackerItems[14] = new TrackerItem(t[14], 3, 7); // Sky Characters
    trackerItems[15] = new TrackerItem(t[15], 0, 1); // Ashei's Sketch
    trackerItems[16] = new TrackerItem(t[16], 0, 1); // Auru's Memo
    trackerItems[17] = new TrackerItem(t[17], 3, 4); // Bottles
    trackerItems[18] = new TrackerItem(t[18], 0, 1, shadowCrystal); // Shadow Crystal
    trackerItems[19] = new TrackerItem(t[19], 1, 4); // Swords
    trackerItems[20] = new TrackerItem(t[20], 1, 3); // Shields
    trackerItems[21] = new TrackerItem(t[21], 0, 1); // Zora Armor
    trackerItems[22] = new TrackerItem(t[22], 0, 1); // Magic Armor
    trackerItems[23] = new TrackerItem(t[23], 2, 3, [wallet, bigWallet, giantWallet]); // Wallets
    trackerItems[24] = new TrackerItem(t[24], 3, 7); // Hidden Skills
    trackerItems[25] = new TrackerItem(t[25], 3, 24); // Golden Bugs
    trackerItems[26] = new TrackerItem(t[26], 3, 60); // Poes
    trackerItems[27] = new TrackerItem(t[27], 1, 5); // Scents
    trackerItems[28] = new TrackerItem(t[28], 3, 45); // Heart Pieces
    trackerItems[29] = new TrackerItem(t[29], 3, 8); // Heart Containers
    trackerItems[30] = new TrackerItem(t[30], 3, 3); // Fused Shadows
    trackerItems[31] = new TrackerItem(t[31], 3, 3); // Mirror Shards
    trackerItems[32] = new TrackerItem(t[32], 0, 1); // Gate Keys
    trackerItems[33] = new TrackerItem(t[33], 3, 3); // Hyrule Castle Keys
    trackerItems[34] = new TrackerItem(t[34], 0, 1); // Hyrule Castle Boss Key
    trackerItems[35] = new TrackerItem(t[35], 0, 1); // Diababa
    trackerItems[36] = new TrackerItem(t[36], 3, 4); // Forest Temple Keys
    trackerItems[37] = new TrackerItem(t[37], 0, 1); // Forest Temple Boss Key
    trackerItems[38] = new TrackerItem(t[38], 0, 1); // Fyrus
    trackerItems[39] = new TrackerItem(t[39], 3, 3); // Goron Mines Keys
    trackerItems[40] = new TrackerItem(t[40], 3, 3); // Goron Mines Boss Keys
    trackerItems[41] = new TrackerItem(t[41], 0, 1); // Morpheel
    trackerItems[42] = new TrackerItem(t[42], 3, 3); // Lakebed Temple Keys
    trackerItems[43] = new TrackerItem(t[43], 0, 1); // Lakebed Temple Boss Key
    trackerItems[44] = new TrackerItem(t[44], 0, 1); // Stallord
    trackerItems[45] = new TrackerItem(t[45], 3, 5); // Arbiter's Grounds Keys
    trackerItems[46] = new TrackerItem(t[46], 0, 1); // Arbiter's Grounds Boss Key
    trackerItems[47] = new TrackerItem(t[47], 0, 1); // Blizzeta
    trackerItems[48] = new TrackerItem(t[48], 3, 4); // Snowpeak Ruins Keys
    trackerItems[49] = new TrackerItem(t[49], 0, 1); // Snowpeak Ruins Boss Key
    trackerItems[50] = new TrackerItem(t[50], 0, 1); // Armogohma
    trackerItems[51] = new TrackerItem(t[51], 3, 3); // Temple of Time Keys
    trackerItems[52] = new TrackerItem(t[52], 0, 1); // Temple of Time Boss Key
    trackerItems[53] = new TrackerItem(t[53], 0, 1); // Argorok
    trackerItems[54] = new TrackerItem(t[54], 3, 1); // City in the Sky Keys
    trackerItems[55] = new TrackerItem(t[55], 0, 1); // City in the Sky Boss Key
    trackerItems[56] = new TrackerItem(t[56], 0, 1); // Zant
    trackerItems[57] = new TrackerItem(t[57], 3, 7); // Palace of Twilight Keys
    trackerItems[58] = new TrackerItem(t[58], 0, 1); // Palace of Twilight Boss Key
    for (let i = 0; i < trackerItems.length; ++i) {
        let state = i == 25 || i == 26 || i == 28 ? getFlagAsCharCode('tracker', i) : getFlagAsNumber('tracker', i);
        if (state < trackerItems[i].max / 2) {
            for (let _ = 0; _ < state; ++_)
                increaseState(i);
        }
        else {
            for (let _ = trackerItems[i].max; _ >= state; --_)
                decreaseState(i);
        }
    }



    dn =  document.getElementById("dn");
    map = L.map('map', {
        zoom: -4,
        minZoom: -5,
        maxZoom: 0,
        center: [-4913, 4257],
        crs: L.CRS.Simple,
        maxBoundsViscosity: 1,
        zoomControl: false,
        keyboard: false,
        doubleClickZoom: false
    }); 
    TL = L.tileLayer('Tiles/{z}/{x}/{y}.png', {
        maxZoom: 0,
        minZoom: -6,
        zoomOffset: 6,
        crs: L.CRS.Simple,
        bounds: [[0, 0], [-9826, 8515]] 
    })
    // window.addEventListener('keydown', mainPopupControls);
    // map.on('keydown', mainPopupControls);  
    document.getElementById("setIcon").addEventListener('click', function() { showRightMenu('settings', "25vw")});
    document.getElementById("setX").addEventListener('click', function() { hideRightMenu('settings')});
    document.getElementById("contIcon").addEventListener('click', function() { showRightMenu('controls', "25vw")});
    document.getElementById("contX").addEventListener('click', function() { hideRightMenu('controls')});
    document.getElementById("trackerIcon").addEventListener('click', function() { showRightMenu('tracker', "29vw")});
    document.getElementById("traX").addEventListener('click', function() { hideRightMenu('tracker')});
    document.getElementById("checkX").addEventListener('click', function() { hideDetails()});  
    console.time('Checks Creation');
    checks = [ //   ♂  ♀
        new Check([-9094, 4809], frI, 0, 'gifts', 0, undefined, undefined, 'Retrieve the cradle from the monkey using the hawk and deliver it to Uli to receive the fishing rod.'),
        new Check([-7405, 4910], laI, 0, 'base', 27, undefined, undefined, 'Talk to Coro to obtain the lantern.'), //TO VERIFY
        new Check([-7023, 4805], sCI, 0, 'base', 29, smaKeyI, undefined, 'Walk into the cave and open the chest to obtain the key to the Faron Woods gate.'),
        new Check([-7023, 4834], cI, 0, 'base', 30, hPI, [lantern], 'Light the 2 torches besides the small chest and climb the ledge to open the chest.'),
        new Check([-7121, 4136], sCI, 0, 'base', 31, yRI, undefined, 'Defeat the Deku Baba and open the chest behind it.'),
        new Check([-7405, 4885], bottleI, 0, 'gifts', 2, undefined, undefined, 'After clearing the Faron twilight, talk to Coro and he will offer you the oil bottle for 100 rupees.'),
        new Check([-7104, 4184], golWolfI, 0, 'skills', 0, undefined, undefined, 'Meet the golden wolf after clearing the Faron Twilight.'),
        new Check([-7222, 4518], sCI, 0, 'base', 52, rRI, [lantern], 'Clear out the purple fog with the lantern and climb the ledge to reach the chest.'),
        new Check([-7010, 4567], sCI, 0, 'base', 53, yRI, [lantern], 'Clear out the purple fog with the lantern and go to the left of the cave entrance to find the chest.'),
        new Check([-7351, 4513], cI, 0, 'base', 54, pRI, [lantern], 'Clearn out the purple fog with the lantern and from the exit of the mist, go right to find the chest.'),
        new Check([-6278, 4930], hPI, 0, 'base', 55, undefined, [[boomerang, clawshot]], 'The heart piece is on the leaves of a tree and can be grabbed with a long ranged item.'),
        new Check([-6344, 4764], bI('Beetle', true), 0, 'bugs', 0, undefined, undefined, 'This ♂ Beetle is on a tree trunk, simply pick it up.'),
        new Check([-5985, 5151], bI('Beetle', false), 0, 'bugs', 1, undefined, [[boomerang, clawshot]], 'This ♀ Beetle is on an elevated tree trunk, use the boomerang or the clawshot to bring it closer.'),


        new Check([-4574, 3388], cI, 0, 'base', 0, hPI, [clawshot], "Use the clawshot on the vines and climb up completely on the platform. Then, grab the ledge to the left of the vines " +
            "and slide right until you reach the platform with the chest."),
        new Check([-4928, 3063], sCI, 1, 'base', 1, yRI, undefined, "Play the Flight By Fowl minigame (20 rupees) and use the Cucco to reach the chest."),
        new Check([-5610, 7578], hPI, 2, 'base', 2, undefined, [bow, bombBag,  [boomerang, clawshot]], "Use the bomb arrows to blow up the rocks up on the ledge, than use the boomerang or the clawshot to obtain the heart piece"),



        new NonCheck([-9517, 5015], horseGI),
        new NonCheck([-8500, 4800], horseGI),
        new NonCheck([-7900, 4857], horseGI),
        new NonCheck([-7701, 4803], horseGI),
        new NonCheck([-6666, 4936], horseGI),
        new NonCheck([-8991, 4960], hawkGI),
        new NonCheck([-8940, 5001], hawkGI),
        new NonCheck([-9169, 4934], hawkGI),
        
    ];
    submaps = [
        new FlooredSubmap([-8791, 4941], orDoorI, 'LinkHouse', [
            [[660, 485], [new Check([-8790, 5289], cI, 0, 'base', 34, pRI, [lantern], 'Use the lantern to locate the chest and be able to open it.')]],
            [[659, 478], [new Check([-8661, 5068], cI, 0, 'base', 35, wooSwoI, undefined, 'The chest is available after buying the slingshot.')]]
        ]),
        new Submap([-8964, 4938], orDoorI, 'SeraShop.png', [464, 491], [
            new Check([-8790, 5034], slI, 0, 'shop', 0, undefined, undefined, "After saving Sera's Cat, you can buy the slingshot for 30 rupees."),
            new Check([-8837, 4880], bottleI, 0, 'gifts', 1, undefined, [fishingRod], 'Obtain the bottle by talking to Sera her cat has returned with a fish you gave him with the fishing rod.')
        ]),
        new Submap([-9080, 4783], orDoorI, 'RuslHouse.png', [656, 449], [
            new Check([-9004, 4850], ordSwoI, 0, 'base', 32, undefined, undefined, 'Pick up the sword on the couch after entering by the front door or by the side of the house by digging as Wolf Link.'),
        ]),
        new Submap([-9037, 5015], orDoorI, 'JaggleHouse.png', [661, 290], [
            new Check([-9044, 4410], ordShieI, 0, 'base', 33, undefined, [shadowCrystal], 'Use Midna to jump to the ledge where the shield is, than bonk on the wall twice to make it fall and obtain it.')
        ]),
        new Submap([-7447, 4718], caveEI, 'FaronEntryCave.png', [455, 495], [
            new Check([-7340, 4450], sCI, 0, 'base', 28, yRI, undefined, 'Use the lantern to be able to locate the chest more easily.')
        ]),
        new Submap([-3733, 3820], grottoI, 'OWCTGrotto.png', [628, 496], [
                new Check([-3718, 3801], cI, 3, 'base', 3, oRI, [clawshot, shadowCrystal], "Use the clawshot on the vines to reach the grotto entrance. Once inside, " + 
                 "defeat all the helmasaurs to make the chest appear.")
        ]),
        new Dungeon([-6915, 4098], [-6950, 4900], starI, 'Forest Temple', [
            [[2810, 2704], [
                new Check([-5935, 4299], sCI, 0, 'base', 34, yRI, [[slingshot, bow, clawshot, boomerang]], 'Use a long ranged item to kill the spiders and climb to the chest.'),
                new Check([-5281, 4222], sCI, 0, 'base', 35, rRI, undefined, 'Use the Bombling on the right to blow up the rock blocking the chest.'),
                new Check([-5260, 4276], cI, 0, 'base', 36, mapI, [[lantern, boomerang]], 'Use the lantern to light the 4 torches that make the platforms to the chest rise or take a long detour' +
                    'by the boomerang bridges to reach the chest.'),
                new FakeCheck([-5261, 4547], ooccooI, 2, undefined, 'Use the Bombling to blow up the rocks, than pick up or break the pot containing Ooccoo.'),
                new Check([-4710, 4794], cI, 0, 'base', 37, smaKeyI, undefined, 'Make your way across the windy bridge and open the chest on the left of the entrance.'),
                new FakeCheck([-5228, 5108], lockI, 3, undefined, 'Locked door'),
                new Check([-5445, 5093], cI, 0, 'base', 38, yRI, undefined, 'Swim to the opening and walk to the end to reach the chest.'),
                new Check([-5155, 5200], sCI, 0, 'base', 39, yRI, undefined, 'The chest is under the wooden structure.'),
                new Check([-5624, 3731], smaKeyI, 0, 'base', 40, undefined, undefined, 'Defeat the Big Baba to obtain the key.'),
                new FakeCheck([-5869, 3737], lockI, 4, undefined, 'Locked door'),
                new Check([-5467, 3883], cI, 0, 'base', 41, hPI, undefined, 'Defeat the Deku Like that blocks the way to access the chest.'),
                new Check([-5277, 3480], cI, 0, 'base', 42, smaKeyI, undefined, 'Bonk on the pillar to make the chest fall.'),
                new Check([-5224, 3223], sCI, 0, 'base', 43, rRI, undefined, 'Climb the vines to reach the chest.'),
                new FakeCheck([-5309, 2940], lockI, 5, [lantern], 'Locked door'),
                new Check([-4508, 4244], gBI, 0, 'base', 44, undefined, undefined, 'Defeat Ook to obtain the Gale Boomerang.'),
                new Check([-5304, 3032], cI, 0, 'base', 45, hPI, [boomerang], 'Blow out all the torches to retract the platform blocking the chest.'),
                new Check([-5386, 4224], cI, 0, 'base', 46, compaI, [[boomerang, bow, clawshot]], 'Use a long ranged item to break the web holding the chest.'),
                new Check([-5439, 5006], bCI, 0, 'base', 47, bossKeyI, [boomerang], 'Use the boomerang on the windmill pillars in this pattern: Bottom Right, Bottom Left, Top Right and Top Left.' + 
                    'This opens the gate to the boss key chest.'),
                new Check([-4322, 4324], cI, 0, 'base', 48, smaKeyI, [[boomerang, bombBag, clawshot]], 'Grab a bombling or use one of your own bombs to defeat the Deku Like and jump across the platforms.'),
                new FakeCheck([-4576, 5059], lockI, 6, [boomerang], 'Locked door'),
                new Check([-4510, 5188], cI, 0, 'base', 49, rRI, undefined, 'Climb up the room by going in the back or simply get launched by the Tile Worm closest to the chest.'),
                new NonCheck([-3930, 4790], fairyI),
                new Check([-3773, 4824], hCI, 0, 'base', 50, undefined, [[woodenSword, bombBag, ballAndChain, bow], [boomerang, clawshot]], 'Defeat Diababa to obtain the heart container.'),
                new Check([-3796, 4759], fusShaI, 0, 'base', 51, undefined, [[woodenSword, bombBag, ballAndChain, bow], [boomerang, clawshot]], 'Defeat Diababa to obtain the fused shadow.')

            ]]
        ]),
        new Dungeon([-3660, 8193], [-3920, 8752], starI, 'Goron Mines', [ // Goron Mines
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]]
        ]),
        new Dungeon([-4741, 3415], [-4960, 4208], starI, 'Lakebed Temple', [
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]]
        ]),
        new Dungeon([-3865, 605], [-4500, 1488], starI, "Arbiter's Grounds", [
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
        ]),
        new Dungeon([-2626, 1229], [-2960, 2112], starI, 'Snowpeak Ruins', [
            [[1467, 1785], [                    
                new Check([-5983, 4430], sCI, 6, 'base', 6, sRI, [ballAndChain], "Break the armor with the Ball and Chain to reveal the chest."),
                new Check([-6014, 4100], sCI, 7, 'base', 7, yRI, [ballAndChain], "Break the armor with the Ball and Chain to reveal the chest."),
                new Check([-5849, 3965], cI, 8, 'base', 8, undefined, undefined, "TODO"),
                new Check([-5300, 3828], sCI, 10, 'base', 10, undefined, undefined, "TODO"),
                new Check([-5410, 3987], cI, 11, 'base', 11, undefined, undefined, "TODO"),
                new Check([-4072, 4270], bACI, 12, 'base', 12, undefined, undefined, "TODO"),
                new Check([-4955, 4382], sCI, 13, 'base', 13, undefined, undefined, "TODO"),
                new Check([-4954, 4936], sCI, 14, 'base', 14, undefined, undefined, "TODO"),
                new Check([-5402, 4925], sCI, 15, 'base', 15, undefined, undefined, "TODO"),
                new Check([-3636, 4272], cI, 16, 'base', 16, undefined, undefined, "TODO"),
                new Check([-4673, 3646], sCI, 18, 'base', 18, undefined, undefined, "TODO"),
                new Check([-4536, 4306], sCI, 19, 'base', 19, undefined, undefined, "TODO"),
                new FakeCheck([-5381, 5064], ooccooI, 0, undefined, "Pick up the pot where Ooccoo is hiding."),
                new Check([-4878, 5634], cI, 21, 'base', 21, undefined, undefined, "TODO"),
                new Check([-5576, 4264], soulI, 23, 'poes', 0, undefined, [shadowCrystal], "The poe is above the ice in the open."),
                new Check([-5433, 4663], sCI, 24, 'base', 24, undefined, undefined, "TODO"),
                new Check([-6462, 4818], soulI, 25, 'poes', 1, undefined, [ballAndChain, shadowCrystal], "Break the armor with the Ball and Chain to reveal the poe."),
                new Check([-5108, 4346], mapI, 27, 'gifts', 20, undefined, undefined, "Talk to Yeta to obtain the dungeon map."),
                new FakeCheck([-4611, 3842], lockI, 1, undefined, "Locked door icon, will probably change")
            ]],
            [[1431, 1347], [
                new Check([-6348, 4666], cI, 5, 'base', 5, undefined, undefined, "TODO"),
                new Check([-5140, 3828], cI, 9, 'base', 9, undefined, undefined, "TODO"),
                new Check([-4448, 3827], cI, 17, 'base', 17, undefined, undefined, "TODO"),
                new Check([-5738, 5566], soulI, 20, 'poes', 2, undefined, [ballAndChain, shadowCrystal], "Break the ice blocks with the Ball and Chain to reveal the poe."),
                new Check([-4936, 5519], sCI, 22, 'base', 22, undefined, undefined, "TODO")

            ]],
            [[622, 427], [
                new Check([-5162, 4878], hCI, 4, 'base', 4, undefined, [ballAndChain], "Defeat Blizzeta to obtain the Heart Container."),
                new Check([-5268, 4680], shardI, 26, 'base', 26, undefined, [ballAndChain], "Defeat Blizzeta and leave the dungeon via the Midna warp to obtain the Mirror Shard.")
            ]]
        ]), 
        new Dungeon([-6618, 3681], [-6580, 4425], starI, 'Temple of Time', [
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
        ]),
        new Dungeon([-5306, 3144], [-5472, 3840], starI, 'City in the Sky', [
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
        ]),
        new Dungeon([-3636, 602], [-3800, 1472], mirI, 'Palace of Twilight', [ 
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
        ]),
        new Dungeon([-3250, 4712], [0,0], castleI, 'Hyrule Castle', [
            [[1, 1], [

            ]],
            [[1, 1], [

            ]],
            [[1, 1], [

            ]]
        ])        
    ];
    console.timeEnd('Checks Creation');
    for(var i = 0; i < settings.length; i++) {
        if (settingsFlags[i] == '1') {
            settings[i].checked = true;
            switch(i) {
                case 1: visibleCategories.push('base'); break;
                case 2: visibleCategories.push('poes'); break;
                case 3: visibleCategories.push('bugs'); break;
                case 4: visibleCategories.push('gifts'); break;
                case 5: visibleCategories.push('skyc'); break;
                case 6: visibleCategories.push('skills'); break;
                case 7: visibleCategories.push('shop'); break;
                case 9: visibleCategories.push('fake'); break;
           }
        }   
    }
    // Adding Dungeon Floor Buttons Logic
    for(let i = 0; i < 8; ++i) {
        let floor = document.getElementById('F' + (i + 1));
        floor.addEventListener("click", function () {
            mapState == 2 ? removeAllLayers() : removeAllLayersExceptTL();
            resetFloorButtons();
            floor.style.filter = 'brightness(200%)';
            floor.style.width = "102.5%";
            floor.style.height = "102.5%";
            floor.style.marginLeft = "-1%";
            activeFloor = i + 1;
            loadedDungeon[i].load();             
        });
        floor.addEventListener('contextmenu', function() {
            if (loadedDungeon[i].isMarked())
                loadedDungeon[i].unset();
            else
                loadedDungeon[i].set();
        });
        floor.addEventListener('mouseover', function() {
            if (activeFloor - 1 == i) 
                return;
            mapState == 2 ? removeAllLayers() : removeAllLayersExceptTL();
            loadedDungeon[i].load();  
        });
        floor.addEventListener('mouseout', function() {
            if (map.getZoom() < -2) 
                return;
            if (activeFloor - 1 == i) 
                return;
            mapState == 2 ? removeAllLayers() : removeAllLayersExceptTL();
            loadedDungeon[activeFloor - 1].load();
        });
    }
    // Creating Provinces
    provinces[0] = new Province([ // Ordona
        [-8053, 5568], [-7628, 6232], [-8208, 6872], [-8776, 7160], [-9752, 6952], [-9876, 6564], [-9976, 5776], [-9924, 5088], 
        [-9750, 4672], [-8792, 4338], [-7853, 4693]
    ], false, [-8816, 5664], [0, 500]);
    provinces[1] = new Province([ // Faron
        [-5412, 5564], [-5374, 5998], [-5954, 6282], [-5944, 7028], [-6700, 7216], [-7144, 6960], [-8048, 5568], [-7844, 4680],
        [-7360, 4200], [-6640, 3464], [-6360, 3744], [-5944, 3776], [-5834, 4743], [-5630, 4883]
    ], false, [-6512, 5536], []);
    provinces[2] = new Province([ // Eldin
        [-5952, 6280], [-5936, 7020], [-5904, 7676], [-6044, 8248], [-5952, 8836], [-5612, 9452], [-5212, 9544], [-4584, 9492], 
        [-3932, 9572], [-3340, 9472], [-2956, 9196], [-2460, 9040], [-1972, 8608], [-1404, 8006], [-1228, 7352], [-2164, 7080], 
        [-2772, 7060], [-2989, 7110], [-3281, 6985], [-3432, 6760], [-3580, 6472], [-3748, 6372], [-3932, 6324], [-4276, 6340], 
        [-4419, 6316], [-4680, 6260], [-5060, 5972], [-5332, 6004],
    ], false, [-4096, 7904], [2]);
    provinces[3] = new Province([ // Desert
        [-6646, 3472], [-6704, 2448], [-6584, 1152], [-6208, 880], [-5240, 1000], [-3668, 1256], [-3480, 1804], [-3646, 2242], 
        [-3804, 2924], [-3840, 3154], [-4984, 3264], [-5116, 3148], [-5280, 3184], [-5472, 3256], [-5640, 3424], [-5953, 3742],
        [-6336, 3736]
    ], false, [-5440, 2224], []);
    provinces[4] = new Province([ // Peak
        [-712, 5344], [-1132, 5392], [-1296, 5360], [-1548, 5152], [-1690, 4891], [-1892, 4804], [-2076, 4624], [-2564, 4404], 
        [-2704, 4220], [-3036, 4080], [-3624, 3880], [-3812, 3184], [-3636, 2272], [-3436, 1720], [-2668, 1568], [-2092, 1804], 
        [-1696, 2288], [-852, 2616], [-620, 3676], [-584, 4612]
    ], false, [-1744, 3488], [])
    let castlePoints = [
        [-2798, 5430], [-2863, 5622], [-2940, 5472], [-3184, 5586], [-3188, 5550], [-3362, 5552], [-3357, 5551], [-3357, 5588], 
        [-3225, 5632], [-3481, 5705], [-3556, 5756], [-3558, 5664], [-3653, 5729], [-3370, 5828], [-3702, 5958], [-3707, 5907], 
        [-3782, 5912], [-3938, 5914], [-3938, 4990], [-3788, 4994], [-3707, 4986], [-3706, 4940], [-3358, 5074], [-3649, 5173], 
        [-3558, 5242], [-3552, 5158], [-3218, 5266], [-3360, 5325], [-3359, 5348], [-3184, 5345], [-3180, 5304], [-2936, 5440]];
    provinces[5] = new Province([[ // Lanayru
        [-5400, 5584], [-5360, 6000], [-5056, 5968], [-4640, 6248], [-4312, 6336], [-3696, 6344], [-3528, 6472], [-3424, 6728], 
        [-3280, 6968], [-2992, 7104], [-2760, 7048], [-2096, 7072], [-1248, 7328], [-800, 7216], [-584, 6768], [-480, 6368], 
        [-504, 5832], [-606, 5444], [-722, 5358], [-1104, 5408], [-1288, 5376], [-1554, 5161], [-1704, 4896], [-1894, 4812], 
        [-2077, 4634], [-2539, 4431], [-2749, 4205], [-3632, 3892], [-3764, 3420], [-3820, 3180], [-4288, 3200], [-4974, 3290],
        [-5081, 3201], [-5319, 3218], [-5592, 3400], [-5936, 3768], [-5813, 4728], [-5776, 4750], [-5624, 4872], [-5552, 5096]
    ], castlePoints], false, [-2192, 5984], [0, 1, 500]);
    provinces[6] = new Province(castlePoints, true, [-3584, 5440], []); // Castle

    loadMainMap(); 


    function onMapClick(e) {
        navigator.clipboard.writeText("[" + Math.round(e.latlng.lat) + ", " + e.latlng.lng + "]")
    }
    map.on('click', onMapClick);
    console.timeEnd('Start');
});

    

    
    
function loadMainMap() {
    mapState = 0;
    document.getElementById('made').style.display = 'block';
    map.setMinZoom(-4);
    map.dragging.disable();
    L.imageOverlay('MainMap/omx4.png', [[0, 0], [-10336, 10176]]).addTo(map); 
    map.setMaxBounds([[0, 0], [-10336, 10176]]);
    map.on("zoomend", zoomToProvinces);
    for (let i = 0; i < provinces.length; ++i)
        provinces[i].load();
    for (let i = submaps.length - 9; i < submaps.length - 1; ++i)
        submaps[i].loadIcon();
    if (!getFlag('settings', 16) && document.getElementById('tracker').style.visibility == 'visible')
        updateMapSize('100vw');  
}
function loadProvinces() {
    if (mapState == 0 && !getFlag('settings', 16) &&
        document.getElementById('tracker').style.visibility == 'visible')
        updateMapSize('71vw');  
    mapState = 1;
    map.setMinZoom(-5);
    document.getElementById('made').style.display = 'none';
    TL.addTo(map); 
    loadMainIcons(); 
    map.on('zoomend', dezoomToMainMap);  
    map.setMaxBounds([[500, -500], [-10000, 9000]]);  
    
}
function loadMainIcons() {
    for (let i = 0; i < checks.length; ++i) {
        checks[i].load();
    }
    for (let i = 0; i < submaps.length; ++i) {
        submaps[i].loadIcon();
    }
}
function loadSubmap(pos) {
    mapState = 3;
    map.setView(pos, 0);     
    map.dragging.disable();
    TL.setOpacity(0.2);
    removeAllLayersExceptTL();
    map.on('zoomend', exitSubmap);
}
function exitSubmap() {
    if (map.getZoom() == 0)
        return;
    map.off('zoomend', exitSubmap);  
    if (mapState == 4) {
        for (let i = 1; i <= loadedDungeon.length; ++i) 
            document.getElementById("F" + i).style.display = 'none';
        document.getElementById('dun').style.display = 'none'
    }
    removeAllLayersExceptTL();
    map.setMinZoom(-5);
    map.dragging.enable();
    mapState = 1;
    TL.setOpacity(1);
    loadMainIcons();
}
function exitDungeon() {
    if (map.getZoom() >= -2)
        return;
    for (let i = 1; i <= loadedDungeon.length; ++i) 
        document.getElementById("F" + i).style.display = 'none';
    document.getElementById('dun').style.display = 'none'
    dn.style.display = "none";
    removeAllLayers();
    window.removeEventListener('keydown', dungeonControls);
    map.off('zoomend', exitDungeon);
    mapState = 1;
    TL.addTo(map);
    map.setMaxBounds([[500, -500], [-10768, 9304]]);
    loadMainIcons();
}
function resetFloorButtons() {
    for (let i = 1; i < loadedDungeon.length + 1; ++i) {
        let floor = document.getElementById('F' + i);
        floor.style.filter = 'brightness(100%)';
        floor.style.width = "100%";
        floor.style.height = "100%";
        floor.style.marginLeft = "0%";
    }  
}
function dungeonControls(e) {
    if (!(e instanceof KeyboardEvent))
        return;
    var key = e.key;
    let prevFloor = activeFloor;
    if (key == undefined)
        key = e.originalEvent.key;
    if (key == "ArrowDown" || key == 's') {
        if (activeFloor == 1) 
            activeFloor = loadedDungeon.length;         
        else
            --activeFloor; 
    }
    else if (key == 'ArrowUp' || key == 'w') {
        if (activeFloor == loadedDungeon.length) 
            activeFloor = 1;
        else
            ++activeFloor;
    }
    else if (key == 'e' || key == "ArrowRight") {
        if (loadedDungeon[activeFloor - 1].isMarked())
            loadedDungeon[activeFloor - 1].unset();
        else
            loadedDungeon[activeFloor - 1].set();
    }
    // else if (key == 'q') {
    //     if(dungeonPopup.isOpen()) {
    //         map.closePopup(dungeonPopup);
    //         visDunPop = false;
    //     }
    //     else {
    //         map.openPopup(dungeonPopup);
    //         visDunPop = true;
    //     }
    // }
    if (activeFloor != prevFloor)
        document.getElementById('F' + activeFloor).click();
}

function zoomOnClick(e) {
    map.setView(L.latLng(e.latlng.lat, e.latlng.lng), -2);  
}
function zoomToProvinces() {
    if (map.getZoom() <= -4)
        return;
    map.dragging.enable();         
    map.off('zoomend', zoomToProvinces);
    removeAllLayers();
    loadProvinces();
}
function dezoomToMainMap() {
    if (map.getZoom() != -5)
        return;
    map.off('zoomend', dezoomToMainMap);    
    map.setView([0, 0], -4);
    hideDetails();
    removeAllLayers();
    loadMainMap();
}
// function mainPopupControls(e) {
//     var key = e.key;
//     if (key == undefined)
//         key = e.originalEvent.key;

//     if (key == 'q') {
//         if(mainPopup.isOpen()) {
//             map.closePopup(mainPopup);
//             visMainPop = false;
//         }
//         else {
//             map.openPopup(mainPopup);
//             visMainPop = true;
//         }
//     }
// }

function removeAllLayers() {
    map.eachLayer(function(l) {
        map.removeLayer(l);
    });
}
function removeAllLayersExceptTL() {
    map.eachLayer(function(l) {
        if (l != TL)
            map.removeLayer(l);
    });
}  
// function reset() {
//     map.eachLayer(function(l) {
//         if(l != mainPopup)
//             map.removeLayer(l);
//     });
// }  
// function resetDungeonFloor() {
//     map.eachLayer(function(l) {
//         if(l != dungeonPopup)
//             map.removeLayer(l);
//     });
// }

function reloadIcons() {
    switch (mapState) {
        case 0 : removeAllLayers(); loadMainMap(); break;
        case 1 : removeAllLayersExceptTL(); loadMainIcons(); break;
        case 2 : removeAllLayers(); loadedDungeon[activeFloor - 1].load(); break;
        case 3 : removeAllLayersExceptTL(); loadedDungeon.load(); break;
        case 4 : removeAllLayersExceptTL(); loadedDungeon[activeFloor - 1].load(); break;
    }
}
function hideDetails() {
    var box = document.getElementById('check'); 
    document.getElementById('cinfo').style.visibility = "hidden";
    document.getElementById('van').style.display = "none"; 
    document.getElementById('reqs').style.display = "none";   
    box.style.width = "0%";
    setTimeout(function() {
        box.style.height = "0%";
        box.style.visibility = "hidden";
    }, 100);
    
    map.off('click', hideDetails);
}
function showRightMenu(menuID, width) {
    let menu = document.getElementById(menuID);
    if (menuID == "tracker") {
        let cpts = document.getElementsByClassName('tcpt');
        for (let i = 0; i < cpts.length; ++i)
            cpts[i].style.display = 'inline';
        if (!getFlag('settings', 16) && mapState > 0)
            updateMapSize('71vw');
    }
    menu.style.visibility = "visible";
    menu.style.width = width;
    menu.style.height = "100%";
    document.getElementById("setIcon").style.display = "none";
    document.getElementById("contIcon").style.display = "none";
    document.getElementById("trackerIcon").style.display = "none";
    // document.getElementsByClassName("leaflet-popup-pane")[0].style.display = "none";
}
function hideRightMenu(menuID) {
    let menu = document.getElementById(menuID);
    if (menuID == "tracker") {
        let cpts = document.getElementsByClassName('tcpt');
        for (let i = 0; i < cpts.length; ++i)
            cpts[i].style.display = 'none';
        if (!getFlag('settings', 16))
            updateMapSize('100vw');
    }
    menu.style.width = "0%";
    document.getElementById("setIcon").style.display = "inline";
    document.getElementById("contIcon").style.display = "inline";
    document.getElementById("trackerIcon").style.display = "inline";
    // document.getElementsByClassName("leaflet-popup-pane")[0].style.display = "inline";
    setTimeout(function() {
        menu.style.height = "0%";
        menu.style.visibility = "hidden";  
    }, 100);  
}
function iconSet(cat, index) {
    if (settings[index].checked) {
        visibleCategories.push(cat);
        setFlag('settings', index, '1');
    }
    else {
        removeFromArray(visibleCategories, cat);
        setFlag('settings', index, '0');
    }
    reloadIcons();
}
function increaseState(traElemIndex) {
    let item = trackerItems[traElemIndex];
    let prevState = item.state;
    ++item.state;
    if (item.state > item.max)
        item.state = 0;
    if (traElemIndex == 23 && item.state == 0)
        ++item.state;
    setTrackerFlag(traElemIndex, item.state);
    updateObtainedItems(item, prevState);
    updateTracker(item);
}
function decreaseState(traElemIndex) {
    let item = trackerItems[traElemIndex];
    let prevState = item.state;
    --item.state;
    if (item.state < 0)
        item.state = item.max;
    if (traElemIndex == 23 && item.state == 0)
        item.state = item.max;
    setTrackerFlag(traElemIndex, item.state);
    updateObtainedItems(item, prevState);
    updateTracker(item);
}
function setTrackerFlag(index, state) {
    if (index == 25 || index == 26 || index == 28)
        state = String.fromCharCode(state);
    else 
        state = state.toString();
    setFlag('tracker', index, state);
}
function updateObtainedItems(item, prevState) {
    if (item.items == undefined)
        return;
    if (item.type == 0 || item.items.length == undefined) {
        if (item.state == 0) // Remove on unmark
            removeFromArray(obtainedItems, item.items);
        else if (prevState == 0) // Put on mark from start
            obtainedItems.push(item.items)
    }
    else {
        if (item.state == 0) {
            if (item.type == 1) //
                removeFromArray(obtainedItems, item.items[prevState - 1]);
            else {
                for(let i = 0; i < item.items.length; ++i) // Reset from max to 0
                    removeFromArray(obtainedItems, item.items[i]);  
            }
        }
        else {
            if (item.type == 1 || prevState > item.state) {
                removeFromArray(obtainedItems, item.items[prevState - 1]);
            }
            if (prevState < item.state)
                obtainedItems.push(item.items[item.state - 1]);
            if (item.type == 2 && item.state == item.max && prevState == 0) { // Add all from 0 to max
                for(let i = 0; i < item.items.length - 1; ++i)
                   obtainedItems.push(item.items[i]);  
            }
            if (item.items[0].name == 'Wallet') { // Handle Wallets since you start with 1
                if (prevState == 1 && item.state == 3) // From 1 to 3
                    obtainedItems.push(bigWallet);
                else if (prevState == 3 && item.state == 1) { //Reset from 3 to 1
                    removeFromArray(obtainedItems, bigWallet);
                    removeFromArray(obtainedItems, giantWallet);
                }
            }
        }
    }
    if(getFlag('settings', 14))
        reloadIcons();
}
function updateTracker(item) {        
    if (item.state == 0) {
        item.elem.style.filter = "brightness(50%)"; // Unmark item     
        if (item.type == 1 || item.type == 2) { //Change item to base
            updateTrackerImg(item);
        }
        else if (item.type == 3) {
            item.elem.childNodes[5].style.visibility = 'hidden'; //Hide counter
            if (item.max > 1) // Don't change color if item max is 1
                item.elem.childNodes[5].style.color = "#c0c0c0";
            if (item.max > 9) // Change width to 1 digit if max is 2 digits
                item.elem.childNodes[5].style.width = "1.25vw";
        }
    }
    else {
        if (item.state == 1 || item.state == item.max) //Mark item
            item.elem.style.filter = "none"; 
        if (item.type == 1 || item.type == 2) {  //Change item
            updateTrackerImg(item);
        }              
        else if (item.type == 3) {
            item.elem.childNodes[5].innerHTML = item.state; // Update Counter
            switch (item.state) {
                case 1: item.elem.childNodes[5].style.visibility = 'visible'; break; //Show Counter
                case 9:  item.elem.childNodes[5].style.width = "1.25vw"; break; // Change width for 1 digit
                case 10: item.elem.childNodes[5].style.width = "1.75vw"; break; // Change width for 2 digits
                case item.max - 1: item.elem.childNodes[5].style.color = "#c0c0c0"; break; // Change color off green
                case item.max:
                    item.elem.childNodes[5].style.visibility = 'visible'; //Show counter
                    item.elem.childNodes[5].style.color = "#50C878"; // Change color to green
                    if (item.max > 9) // Change width to 2 digits if max is 2 digits
                        item.elem.childNodes[5].style.width = "1.75vw";
                    break;
            }  
        }
    }   
}
function updateTrackerImg(item) {
    let imgSrc = item.elem.childNodes[3].src;
    item.elem.childNodes[3].src = imgSrc.slice(0, -5) + 
        (item.state == 0 ? 0 : item.state - 1) + imgSrc.slice(-4); 
}

function removeFromArray(array, item) {
    let i = array.indexOf(item);
        if (i > -1)
            array.splice(i, 1);   
}
function getCounterIcon(icon, num) {
    return L.divIcon({ 
        iconUrl: icon.options.iconUrl,
        iconSize: icon.options.iconSize,
        html: '<img src="' + icon.options.iconUrl + '" width="' + icon.options.iconSize[0] + 'px"' +
              'height="' + icon.options.iconSize[1] + '"><div class="scc">' + num + '</div>'
    });
}
function resetMap(button) {
    for(let i = 0; i < checks.length; ++i) {
        if (checks[i].isSet())
            checks[i].setAsUnmarked();
    }
    for(let i = 0; i < submaps.length; ++i) {
        if (submaps[i].isMarked())
            submaps[i].unmark();
    }   
    resetButtonsFeedback(button, 'Map');
}
function resetTracker(button) {
    for(let i = 0; i < trackerItems.length; ++i) {
        let state = trackerItems[i].state;
        if (i == 23) { // Wallet Special Case
            if (state == 1)
                continue;
            state == 2 ? decreaseState(23) : increaseState(23);
            continue;
        }
        if (state > 0) {
            if (state < trackerItems[i].max / 2) {
                for (let _ = state; _ > 0; --_)
                    decreaseState(i);
            }
            else {
                for (let _ = state; _ < trackerItems[i].max + 1; ++_)
                    increaseState(i);
            }
        }
    }
    resetButtonsFeedback(button, 'Tracker');   
}
function resetButtonsFeedback(button, text) {
    button.innerHTML = "Reset done!";
    button.disabled = true;
    button.classList.remove('setbh');
    button.style.cursor = 'default';
    setTimeout(function() {
        button.innerHTML = "Reset " + text;
        button.disabled = false;
        button.classList.add('setbh');
        button.style.cursor = 'pointer';
    }, 1500);
}
function updateMapSize(width) {
    map.getContainer().style.width = width;
    map.invalidateSize();
}