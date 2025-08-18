class Platform {
    constructor(name, shortname) {
        this.name = name;
        this.shortname = shortname;
        this.imageSrc = "Images/" + shortname + ".png";
    }
}

const Platforms = Object.freeze({
    NES: new Platform("Nintendo Entertainement System", "NES"),
    SNES: new Platform("Super Nintendo Entertainement System", "SNES"),
    N64 : new Platform("Nintendo 64", "N64"),
    GC: new Platform("Nintendo Gamecube", "GC"),
    DS: new Platform("Nintendo DS", "DS"),
    Wii : new Platform("Nintendo Wii", "Wii"),
    WiiU: new Platform("Nintendo WiiU", "WiiU"),
    Switch: new Platform("Nintendo Switch", "Switch"),
    Dolphin: new Platform("Dolphin Emulator", "Dolphin"),
    PL: new Platform("Parallel Launcher", "PL")
});


class Series {
    constructor(name, color, imageSrc=name) {
        this.name = name;
        this.color = color;
        this.imageSrc = "Images/" + imageSrc + ".png";
    }
}

const GameSeries = Object.freeze({
    Mario: new Series("Super Mario", "#FF4E4E", "Mario"),
    Zelda: new Series("The Legend of Zelda", "#009200", "Zelda"),
    Kirby: new Series("Kirby", "#E895FF"),
    Splatoon: new Series("Splatoon", "#959FFF"),
    HW: new Series("Hyrule Warriors", "#009200")
})

class Game {
    constructor(name, series, platforms) {
        this.name = name;
        this.series = series;
        this.platforms = platforms;
    }
}