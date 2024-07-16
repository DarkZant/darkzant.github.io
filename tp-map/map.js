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
            document.getElementById('vandiv').innerHTML = this.iconToImg(this.van);
        }
        else 
            document.getElementById('van').style.display = "none";
        if (this.reqs != undefined) {
            document.getElementById('reqs').style.display = "block";
            let rdHtml = "";
            for (let i = 0; i < this.reqs.length; ++i) {
                if (this.reqs[i].length != undefined) {
                    rdHtml += '<div class="oritem"><p class="idot idotor">•</p>' + this.itemToImg(this.reqs[i][0], 1);
                    for(let j = 1; j < this.reqs[i].length; ++j) {
                        rdHtml += '<div class="itemo"><p class="por">or</p>' + this.itemToImg(this.reqs[i][j], 0.75) + '</div>';
                    }
                    rdHtml += '</div>';
                }
                else {
                    rdHtml += '<div class="item"><p class="idot">•</p>' + this.itemToImg(this.reqs[i], 1) + '</div>';
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
    iconToImg: function(icon) {
        return '<img class="iti" src="' + icon.options.iconUrl +
                '" style="width: ' + icon.options.iconSize[0] + 'px; height: ' + icon.options.iconSize[1] + 'px;">' + 
                '<p class="itp">' + icon.options.iconUrl.slice(6, -4) + '</p>';
    },
    itemToImg: function(item, mult) {
        return '<img class="iti" src="' + item.mapIcon.options.iconUrl +
                '" style="width: ' + item.mapIcon.options.iconSize[0] * mult + 'px; height: ' + item.mapIcon.options.iconSize[1] * mult + 'px;">' + 
                '<p class="itp">' + item.name + '</p>';
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

var Submap = L.Marker.extend({
    initialize: function(latLng, options, image, checks) {
        this._latlng = L.latLng(latLng);
        L.setOptions(this, options);
        this.checks = checks;   
        this.image = image;
        this.checked = this.isMarked();
        this.on('click', this.load);
        this.on('contextmenu', this.mark);
    }, 

    setAsMarked: function() {
        this.setOpacity(0.7);
        this.setZIndexOffset(-1000);
        this.off('contextmenu', this.mark);
        this.on('contextmenu', this.unmark);
    },
    setAsUnmarked: function() {
        this.setOpacity(1);
        this.setZIndexOffset(0);
        this.off('contextmenu', this.unmark);
        this.on('contextmenu', this.mark);
    },
    mark: function() {
        this.setAsMarked();
        for (let i = 0; i < this.checks.length; ++i) {
            this.checks[i].setAsMarked();
        }
    },
    unmark: function() {
        this.setAsUnmarked();
        for (let i = 0; i < this.checks.length; ++i) {
            this.checks[i].setAsUnmarked();
        }
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
        this.addTo(map);
        if (this.isMarked()) 
            this.setAsMarked(); 
        else
            this.setAsUnmarked();
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
    }
}); 

var DungeonFloor = L.ImageOverlay.extend({
    initialize: function(url, bounds, options, checks) {
        this._url = url;
		this._bounds = L.latLngBounds(bounds);
        L.setOptions(this, options);
        this.checks = checks;
    },
    load: function() {
        this.addTo(map);
        this.loadChecks();
        let nwp = this._bounds.getNorthWest();
        let sep = this._bounds.getSouthEast();
        setTimeout(function() {
            map.setMaxBounds(L.latLngBounds([[nwp.lat, nwp.lng - 300], [sep]]));
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
        for (let i = 0; i < this.checks.length; ++i)
            this.checks[i].setAsMarked();
    },
    unset: function() {
        for (let i = 0; i < this.checks.length; ++i)
            this.checks[i].setAsUnmarked();
    },
    isMarked: function() {
        for (let i = 0; i < this.checks.length; ++i) {
            if (!this.checks[i].isMarked()) 
                return false;               
        }
        return true;
    }

});

var Dungeon = Submap.extend({
    initialize: function(latLng, floors) {
        this._latlng = L.latLng(latLng);
        L.setOptions(this, {icon: starI});
        this.floors = floors;   
        this.on('click', this.load);
        this.on('contextmenu', this.mark);
    }, 
    mark: function() {
        this.setAsMarked();
        for (let i = 0; i < this.floors.length; ++i) {
            this.floors[i].set();
        }
    },
    unmark: function() {
        this.setAsUnmarked();
        for (let i = 0; i < this.floors.length; ++i) {
            this.floors[i].unset();
        }
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
        this.addTo(map);
        if (this.isMarked()) 
            this.setAsMarked(); 
        else
            this.setAsUnmarked();
    },
    loadFloor: function(index) {
        this.images[index].addTo(map);
    },
    load: function() { 
        loadedDungeon = this.floors;
        dn.src = this.floors[0]._url.slice(0, -6) + "Name.png";
        dn.style.display = 'flex';
        this.floors[0].load();
        loadDungeon();
        resetFloorButtons();
        for(let i = 0; i < this.floors.length; ++i) {
            let floor = document.getElementById('F' + (i + 1));
            floor.style.display = 'flex';
        }
        document.getElementById('F1').click();
    }
});
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


//Icons
var cI = L.icon({iconUrl: 'Icons/Chest.png', iconSize: [60, 52]}); 
var sCI = L.icon({iconUrl: 'Icons/SmallChest.png', iconSize: [60, 52]});
var hPI = L.icon({iconUrl:'Icons/Heart Piece.png', iconSize: [55, 43]});
var hCI = L.icon({iconUrl:'Icons/Heart Container.png', iconSize: [55, 43]});
var grottoI = L.icon({iconUrl: 'Icons/Grotto.png', iconSize: [45, 45]});
var starI = L.icon({iconUrl: 'Icons/Star.png', iconSize: [50, 50]});
var bABI = L.icon({iconUrl: 'Icons/Bow + Bombs.png', iconSize: [47, 55]});
var gRI = L.icon({iconUrl: 'Icons/Green Rupee.png', iconSize: [35, 55]}); 
var bRI = L.icon({iconUrl: 'Icons/Blue Rupee.png', iconSize: [35, 55]});
var yRI = L.icon({iconUrl: 'Icons/Yellow Rupee.png', iconSize: [35, 55]});
var rRI = L.icon({iconUrl: 'Icons/Red Rupee.png', iconSize: [35, 55]}); 
var pRI = L.icon({iconUrl: 'Icons/Purple Rupee.png', iconSize: [35, 55]}); 
var oRI = L.icon({iconUrl: 'Icons/Orange Rupee.png', iconSize: [35, 55]}); 
var sRI = L.icon({iconUrl: 'Icons/Silver Rupee.png', iconSize: [35, 55]}); 

var gBI = L.icon({iconUrl: 'Icons/Gale Boomerang.png', iconSize: [36, 60]});
var bACI = L.icon({iconUrl: 'Icons/Ball And Chain.png', iconSize: [60, 56]});
var soulI = L.icon({iconUrl: 'Icons/Soul.png', iconSize: [50, 48]});
var ooccooI = L.icon({iconUrl: 'Icons/Ooccoo.png', iconSize: [46.5, 50]});
var shardI = L.icon({iconUrl: 'Icons/Shard.png', iconSize: [50, 47.4]});
var mapI = L.icon({iconUrl: 'Icons/Map.png', iconSize: [50, 42]});
var lockI = L.icon({iconUrl: 'Icons/Lock.png', iconSize: [40, 40]});
var clawI = L.icon({iconUrl: 'Icons/Clawshot.png', iconSize: [49, 50]});
var dclawI = L.icon({iconUrl: 'Icons/ClawshotD.png', iconSize: [55, 51.1]})
var shaCryI = L.icon({iconUrl: 'Icons/Shadow Crystal.png', iconSize: [29, 60]});
//Tracker Icons
var frI = L.icon({iconUrl: 'Icons/Fishing Rod0', iconSize: [24, 55]});
var freI = L.icon({iconUrl: 'Icons/Fishing Rod1', iconSize: [24, 55]});
var slI = L.icon({iconUrl: 'Icons/Slingshot', iconSize: [35.6, 55]});
var laI = L.icon({iconUrl: 'Icons/Lantern', iconSize: [28.3, 55]});
var gaboI = L.icon({iconUrl: 'Icons/Boomerang', iconSize: [27.5, 55]});
var iBI = L.icon({iconUrl: 'Icons/Iron Boots.png', iconSize: [55, 55]});
var boI = L.icon({iconUrl: 'Icons/Bow0.png', iconSize: [55, 55]});
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
var wallet = new Item('Wallet', walI, walI);
var bigWallet = new Item('Big Wallet', walbigI, walbigI);
var giantWallet = new Item('Giant Wallet', walgiI, walgiI);




//Global variables
var visibleCategories = [];
var trackerItems = [];
var obtainedItems = [];
var mapState;
var settings;
var checks;
var submaps;
var TL;
var loadedDungeon;
var activeFloor;
var map;
var dn;
var mainPopup;
var dungeonPopup;
var visMainPop = true;
var visDunPop = true;



document.addEventListener("DOMContentLoaded", function() {
    console.log("Width: " + window.visualViewport.width + " Height: " + window.visualViewport.height)
    console.time('Start');
    if(localStorage.getItem("base") == null) {
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
        if(mapState > 0) {
            if (settings[16].checked)
                map.getContainer().style.width = '100vw'
            else 
                map.getContainer().style.width = '71vw'
            map.invalidateSize(true);
        }
    });


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
        keyboard: false
    }); 
    map.on('contextmenu', function() {});
    loadMainMap(); 
    window.addEventListener('keydown', mainPopupControls);
    map.on('keydown', mainPopupControls);  
    document.getElementById("setIcon").addEventListener('click', function() { showRightMenu('settings', "25vw")});
    document.getElementById("setX").addEventListener('click', function() { hideRightMenu('settings')});
    document.getElementById("trackerIcon").addEventListener('click', function() { showRightMenu('tracker', "29vw")});
    document.getElementById("traX").addEventListener('click', function() { hideRightMenu('tracker')});
    
    mainPopup = L.popup([-7826, 14050], {closeOnClick: false, maxWidth: 360, content: `
        <div style="text-align:center; width: 100%">
        <h2 style="text-decoration:underline">Controls</h2>
        <p style="line-height: 1.8; font-size: 15px">
        Use the <b>Mouse Wheel</b> to <i>Zoom</i></br>
        <b>Click</b> a province to <i>Zoom</i> into it</br>
        <b>Click</b> on a check to <i>Show Details</i> about it</br>
        <b>Click</b> anywhere on the map to <i>Hide</i> the details tab</br>
        <b>Right Click</b> on a check to <i>Mark / Unmark </i> it</br>
        <b>Click</b> on a submap (Dungeon / Grotto) to <i>Zoom</i> into it</br>
        <b>Zoom Out</b> of a submap to <i>Exit</i> it</br>
        <b>Right Click</b> on a submap to <i>Mark / Unmark </i> all the checks inside it</br>
        Press <b>Q</b> to <i>Close / Reopen</i> this popup</br>
        </p></div>`
    });
    dungeonPopup = L.popup([-5908, 6808], {closeOnClick: false, maxWidth: 380, content: `
        <div style="text-align:center; width: 100%">
        <h2 style="text-decoration:underline">Controls</h2>
        <p style="line-height: 1.8; font-size: 15px">
        Press <b>W</b> or <b>↑</b> to <i>Move Up</i> a floor</br>
        Press <b>S</b> or <b>↓</b> to <i>Move Down</i> a floor</br>
        Press <b>E</b> or <b>→</b> to <i>Check / Uncheck</i> the current floor</br>
        <b>Hover</b> on a floor button to <i>Preview</i> a floor</br>
        <b>Click</b> on a floor button to <i>Select</i> a floor</br>
        <b>Right Click</b> on a floor button to <i>Check / Uncheck</i> a floor</br>
        Press <b>Q</b> to <i>Close / Reopen</i> this popup</br>
        <b>Zoom Out</b> to <i>Exit</i> the dungeon map
        </p></div>`
    });
    // mainPopup.openOn(map); 
    console.time('Checks Creation');
    checks = [
        new Check([-4574, 3388], cI, 0, 'base', 0, hPI, [clawshot], "Use the clawshot on the vines and climb up completely on the platform. Then, grab the ledge to the left of the vines " +
            "and slide right until you reach the platform with the chest."),
        new Check([-4928, 3063], sCI, 1, 'base', 1, yRI, undefined, "Play the Flight By Fowl minigame (20 rupees) and use the Cucco to reach the chest."),
        new Check([-5610, 7578], hPI, 2, 'base', 2, undefined, [bow, bombBag,  [boomerang, clawshot]], "Use the bomb arrows to blow up the rocks up on the ledge, than use the boomerang or the clawshot to obtain the heart piece"),
    ];
    submaps = [
        new Submap([-3733, 3820], {icon: grottoI}, 
            L.imageOverlay('Submaps/OWCTGrotto.png', [[-3310, 3417], [-4203, 4204]]), 
            [
                new Check([-3718, 3801], cI, 3, 'base', 3, oRI, [clawshot, shadowCrystal], "Use the clawshot on the vines to reach the grotto entrance. Once inside, " + 
                 "defeat all the helmasaurs to make the chest appear.")
            ]),
        new Dungeon([-2626, 1229], [
            new DungeonFloor('Dungeons/Snowpeak/1F.png', [[-4045, 3552], [-6723, 5752]], {}, [                    
                new Check([-6383, 4824], sCI, 6, 'base', 6, sRI, [ballAndChain], "Break the armor with the Ball and Chain to reveal the chest."),
                new Check([-6444, 4494], sCI, 7, 'base', 7, yRI, [ballAndChain], "Break the armor with the Ball and Chain to reveal the chest."),
                new Check([-5849, 3965], cI, 8, 'base', 8, undefined, undefined, "TODO"),
                new Check([-5300, 3828], sCI, 10, 'base', 10, undefined, undefined, "TODO"),
                new Check([-5410, 3987], cI, 11, 'base', 11, undefined, undefined, "TODO"),
                new Check([-4592, 4664], bACI, 12, 'base', 12, undefined, undefined, "TODO"),
                new Check([-4955, 4382], sCI, 13, 'base', 13, undefined, undefined, "TODO"),
                new Check([-4954, 4936], sCI, 14, 'base', 14, undefined, undefined, "TODO"),
                new Check([-5402, 4925], sCI, 15, 'base', 15, undefined, undefined, "TODO"),
                new Check([-4156, 4666], cI, 16, 'base', 16, undefined, undefined, "TODO"),
                new Check([-4673, 3646], sCI, 18, 'base', 18, undefined, undefined, "TODO"),
                new Check([-4536, 4306], sCI, 19, 'base', 19, undefined, undefined, "TODO"),
                new FakeCheck([-5854, 5427], ooccooI, 0, undefined, "Pick up the pot where Ooccoo is hiding."),
                new Check([-4878, 5634], cI, 21, 'base', 21, undefined, undefined, "TODO"),
                new Check([-6004, 4665], soulI, 23, 'poes', 0, undefined, [shadowCrystal], "The poe is above the ice in the open."),
                new Check([-5433, 4663], sCI, 24, 'base', 24, undefined, undefined, "TODO"),
                new Check([-6462, 4818], soulI, 25, 'poes', 1, undefined, [ballAndChain, shadowCrystal], "Break the armor with the Ball and Chain to reveal the poe."),
                new Check([-5582, 4732], mapI, 27, 'gifts', 0, undefined, undefined, "Talk to Yeta to obtain the dungeon map."),
                new FakeCheck([-5113, 4254], lockI, 1, undefined, "Locked door icon, will probably change")
            ]),
            new DungeonFloor('Dungeons/Snowpeak/2F.png', [[-4374, 3580], [-6394, 5724]], {}, [
                new Check([-6348, 4666], cI, 5, 'base', 5, undefined, undefined, "TODO"),
                new Check([-5140, 3828], cI, 9, 'base', 9, undefined, undefined, "TODO"),
                new Check([-4448, 3827], cI, 17, 'base', 17, undefined, undefined, "TODO"),
                new Check([-5738, 5566], soulI, 20, 'poes', 2, undefined, [ballAndChain, shadowCrystal], "Break the ice blocks with the Ball and Chain to reveal the poe."),
                new Check([-4936, 5519], sCI, 22, 'base', 22, undefined, undefined, "TODO")

            ]),
            new DungeonFloor('Dungeons/Snowpeak/3F.png', [[-4957, 4030], [-5811, 5274]], {}, [
                new Check([-5162, 4878], hCI, 4, 'base', 4, undefined, [ballAndChain], "Defeat Blizzeta to obtain the Heart Container."),
                new Check([-5268, 4680], shardI, 26, 'base', 26, undefined, [ballAndChain], "Defeat Blizzeta and leave the dungeon via the Midna warp to obtain the Mirror Shard.")
            ])
        ]), 
        new Dungeon([-6618, 3681], [
            new DungeonFloor('Dungeons/ToT/1F.png', [[-4957, 3530], [-5811, 5274]], {}, []),
            new DungeonFloor('Dungeons/ToT/2F.png', [[-4957, 3530], [-5811, 5274]], {}, []),
            new DungeonFloor('Dungeons/ToT/3F.png', [[-4957, 3530], [-5811, 5274]], {}, []),
            new DungeonFloor('Dungeons/ToT/4F.png', [[-4957, 3530], [-5811, 5274]], {}, []),
            new DungeonFloor('Dungeons/ToT/5F.png', [[-4957, 3530], [-5811, 5274]], {}, []),
            new DungeonFloor('Dungeons/ToT/6F.png', [[-4957, 3530], [-5811, 5274]], {}, []),
            new DungeonFloor('Dungeons/ToT/7F.png', [[-4957, 3530], [-5811, 5274]], {}, []),
            new DungeonFloor('Dungeons/ToT/8F.png', [[-4957, 3530], [-5811, 5274]], {}, []),
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
    for(let i = 0; i < 8; ++i) {
        let floor = document.getElementById('F' + (i + 1));
        floor.addEventListener("click", function () {
            resetDungeonFloor();
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
                resetDungeonFloor();
                loadedDungeon[i].load();  
        });
        floor.addEventListener('mouseout', function() {
            if (map.getZoom() < -2) 
                return;
            resetDungeonFloor();
            loadedDungeon[activeFloor - 1].load();
        });
    }
    //loadDungeonIcons();


    function onMapClick(e) {
        navigator.clipboard.writeText("[" + Math.round(e.latlng.lat) + ", " + e.latlng.lng + "]")
    }
    map.on('click', onMapClick);
    console.timeEnd('Start');
});

    

    
    
function loadMainMap() {
    mapState = 0;
    document.getElementById('made').style.display = 'block';
    if (!settings[16].checked) {
        map.getContainer().style.width = '100vw'
        map.invalidateSize();
    }
    map.setMinZoom(-4);
    map.dragging.disable();
    L.imageOverlay('MainMap/omx4.png', [[0, 0], [-10336, 10176]]).addTo(map); 
    map.setMaxBounds([[0, 0], [-10336, 10176]]);
    map.on("zoomend", zoomToProvinces);
    var faronPoly = L.polygon([
        [-5412, 5564], [-5432, 6028], [-5980, 6276], [-5944, 7028], [-6700, 7216], [-7144, 6960], [-8048, 5568], [-7844, 4680], 
        [-7360, 4200], [-6640, 3464], [-6360, 3744], [-5968, 3776], [-5876, 4752], [-5628, 4928]
    ], { fillColor: '#6e5b1e', fillOpacity: 0, opacity: 0}).addTo(map);
    faronPoly.on('mouseover', highlightRegion);
    faronPoly.on('mouseout', leaveRegion);
    faronPoly.on('click', zoomOnClick)

    var ordonaPoly = L.polygon([
        [-8053, 5568], [-7628, 6232], [-8208, 6872], [-8776, 7160], [-9752, 6952], [-9876, 6564], [-9976, 5776], [-9924, 5088], 
        [-9750, 4672], [-8792, 4338], [-7853, 4693]
    ], { fillColor: '#6e5b1e', fillOpacity: 0, opacity: 0 }).addTo(map);
    ordonaPoly.on('mouseover', highlightRegion);
    ordonaPoly.on('mouseout', leaveRegion);
    ordonaPoly.on('click', zoomOnClick);

    var castlePoints = [
        [-2798, 5430], [-2863, 5622], [-2940, 5472], [-3184, 5586], [-3188, 5550], [-3362, 5552], [-3357, 5551], [-3357, 5588], 
        [-3225, 5632], [-3481, 5705], [-3556, 5756], [-3558, 5664], [-3653, 5729], [-3370, 5828], [-3702, 5958], [-3707, 5907], 
        [-3782, 5912], [-3938, 5914], [-3938, 4990], [-3788, 4994], [-3707, 4986], [-3706, 4940], [-3358, 5074], [-3649, 5173], 
        [-3558, 5242], [-3552, 5158], [-3218, 5266], [-3360, 5325], [-3359, 5348], [-3184, 5345], [-3180, 5304], [-2936, 5440]];
    var castlePoly = L.polygon(castlePoints, 
        { fillColor: '#6e5b1e', fillOpacity: 0, opacity: 0 }).addTo(map);
    castlePoly.on('mouseover', highlightRegion);
    castlePoly.on('mouseout', leaveRegion);

    var desertPoly = L.polygon([
        [-6646, 3472], [-6704, 2448], [-6584, 1152], [-6208, 880], [-5240, 1000], [-3668, 1256], [-3568, 1800], [-3918, 2936], 
        [-4168, 3152], [-4984, 3264], [-5116, 3148], [-5280, 3184], [-5472, 3256], [-5640, 3424], [-5800, 3720], [-6336, 3736]
    ], { fillColor: '#6e5b1e', fillOpacity: 0, opacity: 0 }).addTo(map);
    desertPoly.on('mouseover', highlightRegion);
    desertPoly.on('mouseout', leaveRegion);
    desertPoly.on('click', zoomOnClick);

    var peakPoly = L.polygon([
        [-712, 5344], [-1132, 5392], [-1296, 5360], [-1548, 5152], [-1660, 4864], [-1892, 4804], [-2076, 4624], [-2564, 4404], 
        [-2704, 4220], [-3036, 4080], [-3624, 3880], [-3812, 3184], [-3636, 2272], [-3436, 1720], [-2668, 1568], [-2092, 1804], 
        [-1696, 2288], [-852, 2616], [-620, 3676], [-584, 4612]
    ], { fillColor: '#6e5b1e', fillOpacity: 0, opacity: 0 }).addTo(map);
    peakPoly.on('mouseover', highlightRegion);
    peakPoly.on('mouseout', leaveRegion);
    peakPoly.on('click', zoomOnClick);

    var eldinPoly = L.polygon([
        [-5952, 6280], [-5936, 7020], [-5904, 7676], [-6044, 8248], [-5952, 8836], [-5612, 9452], [-5212, 9544], [-4584, 9492], 
        [-3932, 9572], [-3340, 9472], [-3128, 9056], [-2460, 9040], [-1972, 8608], [-1404, 8006], [-1228, 7352], [-2164, 7080], 
        [-2772, 7060], [-3004, 7128], [-3288, 7032], [-3432, 6760], [-3580, 6472], [-3748, 6372], [-3932, 6324], [-4276, 6340], 
        [-4420, 6340], [-4680, 6260], [-5060, 5972], [-5332, 6004], [-5544, 6132]  
    ], { fillColor: '#6e5b1e', fillOpacity: 0, opacity: 0 }).addTo(map);
    eldinPoly.on('mouseover', highlightRegion);
    eldinPoly.on('mouseout', leaveRegion);
    eldinPoly.on('click', zoomOnClick)

    var lanayruPoly = L.polygon([[
        [-5400, 5584], [-5360, 6000], [-5056, 5968], [-4640, 6248], [-4312, 6336], [-3696, 6344], [-3528, 6472], [-3424, 6728], 
        [-3280, 6968], [-2992, 7104], [-2760, 7048], [-2096, 7072], [-1248, 7328], [-800, 7216], [-584, 6768], [-480, 6368], 
        [-504, 5832], [-528, 5368], [-1104, 5408], [-1288, 5376], [-1584, 5184], [-1704, 4896], [-1992, 4800], [-2080, 4672], 
        [-2544, 4472], [-2720, 4256], [-3736, 3928], [-3808, 3432], [-3976, 3168], [-4288, 3200], [-4536, 3368], [-4872, 3400], 
        [-5081, 3201], [-5319, 3218], [-5592, 3400], [-5720, 3632], [-5936, 3768], [-5888, 4176], [-5816, 4776], [-5624, 4872], [-5552, 5096]
    ], castlePoints], { fillColor: '#6e5b1e', fillOpacity: 0, opacity: 0 }).addTo(map);
    lanayruPoly.on('mouseover', highlightRegion);
    lanayruPoly.on('mouseout', leaveRegion);
    lanayruPoly.on('click', zoomOnClick);
}

function highlightRegion() {
    this.setStyle({ fillOpacity: 0.5 });
}
function leaveRegion() {
    this.setStyle({ fillOpacity: 0 });
}

function loadProvinces() {
    mapState = 1;
    if (!settings[16].checked) {
        map.getContainer().style.width = '71vw'
        map.invalidateSize();
    }
    map.invalidateSize();
    map.setMinZoom(-5);
    document.getElementById('made').style.display = 'none';
    TL = L.tileLayer('Tiles/{z}/{x}/{y}.png', {
        maxZoom: 0,
        minZoom: -6,
        zoomOffset: 6,
        crs: L.CRS.Simple,
        bounds: [[0, 0], [-9826, 8515]]
    }).addTo(map); 
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
function loadDungeonIcons() {
    submaps[1].loadIcon();
}
function loadSubmap(pos) {
    mapState = 3;
    map.setView(pos, 0);     
    map.dragging.disable();
    TL.setOpacity(0.3);
    unload();
    map.on('zoomstart', exitSubmap);
}
function exitSubmap() {
    if (map.getZoom() != 0)
        return;
    map.off('zoomstart', exitSubmap);  
    unload();
    map.setMinZoom(-5);
    map.dragging.enable();
    mapState = 1;
    TL.setOpacity(1);
    loadMainIcons();
}
function loadDungeon() {
    mapState = 2;
    reset();
    map.setView([-5384, 4652], -2);
    if (visDunPop)
        dungeonPopup.openOn(map);
    window.removeEventListener('keydown', mainPopupControls);
    map.off('keydown', mainPopupControls);
    window.addEventListener('keydown', dungeonControls);
    map.on('keydown', dungeonControls);
    map.on('zoomend', exitDungeon);
}
function exitDungeon() {
    if (map.getZoom() >= -2)
        return;
    for (let i = 1; i <= loadedDungeon.length; ++i) {
        document.getElementById("F" + i).style.display = 'none';
    }
    dn.style.display = "none";
    reset();
    window.removeEventListener('keydown', dungeonControls);
    map.off('keydown', dungeonControls);
    map.off('zoomend', exitDungeon);
    window.addEventListener('keydown', mainPopupControls);
    map.on('keydown', mainPopupControls);
    if (visMainPop) 
        mainPopup.openOn(map);
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
    else if (key == 'q') {
        if(dungeonPopup.isOpen()) {
            map.closePopup(dungeonPopup);
            visDunPop = false;
        }
        else {
            map.openPopup(dungeonPopup);
            visDunPop = true;
        }
    }
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
    reset();
    loadProvinces();
}
function dezoomToMainMap() {
    if (map.getZoom() != -5)
        return;
    map.off('zoomend', dezoomToMainMap);    
    map.setView([0, 0], -4);
    hideDetails();
    reset();
    loadMainMap();
    //loadDungeonIcons();
}
function mainPopupControls(e) {
    var key = e.key;
    if (key == undefined)
        key = e.originalEvent.key;

    if (key == 'q') {
        if(mainPopup.isOpen()) {
            map.closePopup(mainPopup);
            visMainPop = false;
        }
        else {
            map.openPopup(mainPopup);
            visMainPop = true;
        }
    }
}
function resetDungeonFloor() {
    map.eachLayer(function(l) {
        if(l != dungeonPopup)
            map.removeLayer(l);
    });
}
function reset() {
    map.eachLayer(function(l) {
        if(l != mainPopup)
            map.removeLayer(l);
    });
}  
function unload() {
    map.eachLayer(function(l) {
        if (l != TL)
            map.removeLayer(l);
    });
}  
function reloadIcons() {
    switch (mapState) {
        case 0 : reset(); loadMainMap(); break;
        case 1 : unload(); loadMainIcons(); break;
        case 2 : resetDungeonFloor(); loadedDungeon[activeFloor - 1].load(); break;
        case 3 : unload(); loadedDungeon.load(); break;
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

    }
    menu.style.visibility = "visible";
    menu.style.width = width;
    menu.style.height = "100%";
    document.getElementById("setIcon").style.display = "none";
    document.getElementById("trackerIcon").style.display = "none";
    document.getElementsByClassName("leaflet-popup-pane")[0].style.display = "none";
}
function hideRightMenu(menuID) {
    let menu = document.getElementById(menuID);
    if (menuID == "tracker") {
        let cpts = document.getElementsByClassName('tcpt');
        for (let i = 0; i < cpts.length; ++i)
            cpts[i].style.display = 'none';

    }
    menu.style.width = "0%";
    document.getElementById("setIcon").style.display = "inline";
    document.getElementById("trackerIcon").style.display = "inline";
    document.getElementsByClassName("leaflet-popup-pane")[0].style.display = "inline";
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
    console.log(obtainedItems);
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
function updateMaxBounds(bounds) {
    L.setOptions(map, {maxBounds: L.latLngBounds(bounds)});
    map.on('moveend', map._panInsideMaxBounds);
    var center = map.getCenter(),
		    newCenter = map._limitCenter(center, map._zoom, L.latLngBounds(bounds));
    map.setView(newCenter);
    if (!center.equals(newCenter)) {
        map.panTo(newCenter, {animate: false});
    }

}