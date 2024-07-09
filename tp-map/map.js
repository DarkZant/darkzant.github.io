//Flag functions

function setFlag(cat, index, value) {
    var flags = localStorage.getItem(cat);
    flags = flags.substring(0, index) + value + flags.substring(index + 1);
    localStorage.setItem(cat, flags);
}

function getFlag(cat, index) {
    return localStorage.getItem(cat)[index] == '1';
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
    isVisible: function() {
        return activeMarkers.includes(this.cat);
    },
    load: function() {
        if (this.isVisible()) {
            if (getFlag('settings', 12) && this.van != undefined) {
                let temp = this.options.icon;
                L.setOptions(this, {icon: this.van});
                this.addTo(map);
                L.setOptions(this, {icon: temp});
            } 
            else
                this.addTo(map);
            if(this.isSet())
                this.setAsMarked();
            return true;
        }
        else 
            return false;     
    },
    showDetails: function() {
        var box = document.getElementById('check');
        box.style.visibility = "visible";
        box.style.width = "25%";
        box.style.height = "100%";
        if (this.van != undefined) {
            document.getElementById('van').style.display = "block";
            document.getElementById('vandiv').innerHTML = this.iconToImg(this.van, 1);
        }
        else 
            document.getElementById('van').style.display = "none";
        if (this.reqs != undefined) {
            document.getElementById('reqs').style.display = "block";
            var rd = document.getElementById('reqsdiv');
            rd.innerHTML = "";
            for (let i = 0; i < this.reqs.length; ++i) {
                if (this.reqs[i + 1] == 0) {
                    rd.innerHTML += '<div class="oritem"><p>•</p>' + this.iconToImg(this.reqs[i], 0.7) + '<p style="font-size: 30px; padding-left: 20px;">/</p>' +
                    this.iconToImg(this.reqs[i + 2], 0.7) + '</div>';
                    i += 2;
                }
                else {
                    rd.innerHTML += '<div class="item"><p>•</p>' + this.iconToImg(this.reqs[i], 1) + '</div>';
                }
                
            }
        }
        else 
            document.getElementById('reqs').style.display = "none";
        document.getElementById('cinfo').style.visibility = "visible";
        document.getElementById('cinfodiv').innerHTML = this.info;
        map.on('click', hideDetails);
    },
    iconToImg: function(icon, mult) {
        return '<img class="iti" src="' + icon.options.iconUrl +
                '" style="width: ' + icon.options.iconSize[0] * mult + 'px; height: ' + icon.options.iconSize[1] * mult + 'px;">' + 
                '<p class="itp">' + icon.options.iconUrl.slice(6, -4) + '</p>';
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
                if (this.checks[i].isVisible()) {
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
        map.setMaxBounds(L.latLngBounds(
            [[this._bounds.getNorthWest().lat, this._bounds.getNorthWest().lng - 300], 
            [this._bounds.getSouthEast()]]));
        this.loadChecks();
        
    },
    isVisible: function () {
        let visible = false;
        for (let i = 0; i < this.checks.length; ++i) {
            if (this.checks[i].isVisible()) {
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
                if (this.floors[i].isVisible()) {
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
    constructor(elem, type, max) {
        this.elem = elem;
        this.type = type;
        this.max = max;
        this.state = 0;
        elem.addEventListener('click', this.increaseState);
    }
    increaseState() {
        console.log(this.state);
        ++this.state;
        if (this.state > this.max)
            this.state = 0;
        this.updateTracker();

    }
    decreaseState() {
        --this.state;
        if (this.state < 0)
            this.state = this.max;
        this.updateTracker();
    }
    updateTracker() {
        switch(this.state) {
            case 0: this.elem.style.filter = "brightness(50%);"; break;
            case 1: this.elem.style.filter = "brightness(100%);"; break;
                
        }
    }

}


//Icons
var cI = L.icon({iconUrl: 'Icons/Chest.png', iconSize: [60, 52]}); 
var sCI = L.icon({iconUrl: 'Icons/SmallChest.png', iconSize: [60, 52]});
var hPI = L.icon({iconUrl:'Icons/Heart Piece.png', iconSize: [55, 43]});
var hCI = L.icon({iconUrl:'Icons/Heart Container.png', iconSize: [55, 43]});
var grottoI = L.icon({iconUrl: 'Icons/Grotto.png', iconSize: [45, 45]});
var starI = L.icon({iconUrl: 'Icons/Star.png', iconSize: [50, 50]});
var gBI = L.icon({iconUrl: 'Icons/Gale Boomerang.png', iconSize: [36, 60]});
var bACI = L.icon({iconUrl: 'Icons/Ball And Chain.png', iconSize: [60, 56]});
var soulI = L.icon({iconUrl: 'Icons/Soul.png', iconSize: [50, 48]});
var ooccooI = L.icon({iconUrl: 'Icons/Ooccoo.png', iconSize: [46.5, 50]});
var shardI = L.icon({iconUrl: 'Icons/Shard.png', iconSize: [50, 47.4]});
var mapI = L.icon({iconUrl: 'Icons/Map.png', iconSize: [50, 42]});
var lockI = L.icon({iconUrl: 'Icons/Lock.png', iconSize: [40, 40]});
var clawI = L.icon({iconUrl: 'Icons/Clawshot.png', iconSize: [49, 50]});
var shaCryI = L.icon({iconUrl: 'Icons/Shadow Crystal.png', iconSize: [29, 60]});
var bABI = L.icon({iconUrl: 'Icons/Bow + Bombs.png', iconSize: [47, 55]});
var gRI = L.icon({iconUrl: 'Icons/Green Rupee.png', iconSize: [35, 55]}); 
var bRI = L.icon({iconUrl: 'Icons/Blue Rupee.png', iconSize: [35, 55]});
var yRI = L.icon({iconUrl: 'Icons/Yellow Rupee.png', iconSize: [35, 55]});
var rRI = L.icon({iconUrl: 'Icons/Red Rupee.png', iconSize: [35, 55]}); 
var pRI = L.icon({iconUrl: 'Icons/Purple Rupee.png', iconSize: [35, 55]}); 
var oRI = L.icon({iconUrl: 'Icons/Orange Rupee.png', iconSize: [35, 55]}); 
var sRI = L.icon({iconUrl: 'Icons/Silver Rupee.png', iconSize: [35, 55]}); 





//Global variables
var activeMarkers = [];
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


    var t = document.getElementsByClassName('titem');
    new TrackerItem(t[0], 0, 1);




    dn =  document.getElementById("dn");
    map = L.map('map', {
        zoom: -4,
        minZoom: -5,
        maxZoom: 0,
        center: [0, 0],
        bounds: [[0, 646], [646, 0]],
        crs: L.CRS.Simple,
        maxBoundsViscosity: 1,
        zoomControl: false,
        doubleClickZoom: false,
        keyboard: false
    }); 
    map.on('contextmenu', function() {});
    loadMainMap(); 
    window.addEventListener('keydown', mainPopupControls);
    map.on('keydown', mainPopupControls);  
    document.getElementById("setIcon").addEventListener('click', function() { showRightMenu(document.getElementById('settings'), "25%")});
    document.getElementById("setX").addEventListener('click', function() { hideRightMenu(document.getElementById('settings'))});
    document.getElementById("trackerIcon").addEventListener('click', function() { showRightMenu(document.getElementById('tracker'), "29%")});
    document.getElementById("traX").addEventListener('click', function() { hideRightMenu(document.getElementById('tracker'))});
    
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
    checks = [
        new Check([-5013, 3818], cI, 0, 'base', 0, hPI, [clawI], "Use the clawshot on the vines and climb up completely on the platform. Then, grab the ledge to the left of the vines " +
            "and slide right until you reach the platform with the chest."),
        new Check([-5357, 3494], sCI, 1, 'base', 1, yRI, undefined, "Play the Flight By Fowl minigame (20 rupees) and use the Cucco to reach the chest."),
        new Check([-6048, 8007], hPI, 2, 'base', 2, undefined, [bABI, gBI, 0, clawI], "Use the bomb arrows to blow up the rocks up on the ledge, than use the boomerang or the clawshot to obtain the heart piece"),
    ];
    submaps = [
        new Submap([-4173, 4253], {icon: grottoI}, 
            L.imageOverlay('Submaps/OWCTGrotto.png', [[-3750, 3850], [-4643, 4637]]), 
            [
                new Check([-4126, 4239], cI, 3, 'base', 3, oRI, [clawI, shaCryI], "Use the clawshot on the vines to reach the grotto entrance. Once inside, " + 
                 "defeat all the helmasaurs to make the chest appear.")
            ]),
        new Dungeon([-3034, 1665], [
            new DungeonFloor('Dungeons/Snowpeak/1F.png', [[-4045, 3552], [-6723, 5752]], {}, [                    
                new Check([-6383, 4824], sCI, 6, 'base', 6, sRI, [bACI], "Break the armor with the Ball and Chain to reveal the chest."),
                new Check([-6444, 4494], sCI, 7, 'base', 7, yRI, [bACI], "Break the armor with the Ball and Chain to reveal the chest."),
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
                new Check([-6004, 4665], soulI, 23, 'poes', 0, undefined, [shaCryI], "The poe is above the ice in the open."),
                new Check([-5433, 4663], sCI, 24, 'base', 24, undefined, undefined, "TODO"),
                new Check([-6462, 4818], soulI, 25, 'poes', 1, undefined, [bACI, shaCryI], "Break the armor with the Ball and Chain to reveal the poe."),
                new Check([-5582, 4732], mapI, 27, 'gifts', 0, undefined, undefined, "Talk to Yeta to obtain the dungeon map."),
                new FakeCheck([-5113, 4254], lockI, 1, undefined, "Locked door icon, will probably change")
            ]),
            new DungeonFloor('Dungeons/Snowpeak/2F.png', [[-4374, 3580], [-6394, 5724]], {}, [
                new Check([-6348, 4666], cI, 5, 'base', 5, undefined, undefined, "TODO"),
                new Check([-5140, 3828], cI, 9, 'base', 9, undefined, undefined, "TODO"),
                new Check([-4448, 3827], cI, 17, 'base', 17, undefined, undefined, "TODO"),
                new Check([-5738, 5566], soulI, 20, 'poes', 2, undefined, [bACI, shaCryI], "Break the ice blocks with the Ball and Chain to reveal the poe."),
                new Check([-4936, 5519], sCI, 22, 'base', 22, undefined, undefined, "TODO")

            ]),
            new DungeonFloor('Dungeons/Snowpeak/3F.png', [[-4957, 4030], [-5811, 5274]], {}, [
                new Check([-5162, 4878], hCI, 4, 'base', 4, undefined, [bACI], "Defeat Blizzeta to obtain the Heart Container."),
                new Check([-5268, 4680], shardI, 26, 'base', 26, undefined, [bACI], "Defeat Blizzeta and leave the dungeon via the Midna warp to obtain the Mirror Shard.")
            ])
        ]), 
        new Dungeon([-7113, 4116], [
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
    for(var i = 0; i < settings.length; i++) {
        if (settingsFlags[i] == '1') {
            settings[i].checked = true;
            switch(i) {
                case 1: activeMarkers.push('base'); break;
                case 2: activeMarkers.push('poes'); break;
                case 3: activeMarkers.push('bugs'); break;
                case 4: activeMarkers.push('gifts'); break;
                case 5: activeMarkers.push('skyc'); break;
                case 6: activeMarkers.push('skills'); break;
                case 7: activeMarkers.push('shop'); break;
                case 9: activeMarkers.push('fake'); break;
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

});

    

    
    
function loadMainMap() {
    mapState = 0;
    document.getElementById('made').style.display = 'block';
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
    map.setMinZoom(-5);
    document.getElementById('made').style.display = 'none';
    TL = L.tileLayer('Tiles/{z}/{x}/{y}.png', {
        maxZoom: 0,
        minZoom: -6,
        zoomOffset: 6,
        crs: L.CRS.Simple,
        bounds: [[0, 0], [-10768, 9304]]
    }).addTo(map); 
    loadMainIcons(); 
    map.on('zoomend', dezoomToMainMap);     
    map.setMaxBounds([[0, 0], [-10768, 9304]]);      
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
    map.setMaxBounds([[0, 0], [-10768, 9304]]);
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
        case 0 :  reset(); loadMainMap(); break;
        case 1 :  unload(); loadMainIcons(); break;
        case 2 :  resetDungeonFloor(); loadedDungeon[activeFloor - 1].load(); break;
        case 3 :  unload(); loadedDungeon.load(); break;
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
function showSettings() {
    var box = document.getElementById('settings');
    box.style.visibility = "visible";
    box.style.width = "25%";
    box.style.height = "100%";
    document.getElementById("setIcon").style.display = "none";
    document.getElementById("trackerIcon").style.display = "none";
    document.getElementsByClassName("leaflet-popup-pane")[0].style.display = "none";
}
function hideSettings() {
    var box = document.getElementById('settings'); 
    box.style.width = "0%";
    document.getElementById("setIcon").style.display = "inline";
    document.getElementById("trackerIcon").style.display = "inline";
    document.getElementsByClassName("leaflet-popup-pane")[0].style.display = "inline";
    setTimeout(function() {
        box.style.height = "0%";
        box.style.visibility = "hidden";       
    }, 100);  
}
function showRightMenu(box, width) {
    box.style.visibility = "visible";
    box.style.width = width;
    box.style.height = "100%";
    document.getElementById("setIcon").style.display = "none";
    document.getElementById("trackerIcon").style.display = "none";
    document.getElementsByClassName("leaflet-popup-pane")[0].style.display = "none";
}
function hideRightMenu(box) {
    box.style.width = "0%";
    document.getElementById("setIcon").style.display = "inline";
    document.getElementById("trackerIcon").style.display = "inline";
    document.getElementsByClassName("leaflet-popup-pane")[0].style.display = "inline";
    setTimeout(function() {
        box.style.height = "0%";
        box.style.visibility = "hidden";       
    }, 100);  
}
function iconSet(cat, index) {
    if (settings[index].checked) {
        activeMarkers.push(cat);
        setFlag('settings', index, '1');
    }
    else {
        let i = activeMarkers.indexOf(cat);
        if (i > -1)
            activeMarkers.splice(i, 1);   
        setFlag('settings', index, '0');
    }
    reloadIcons();
}