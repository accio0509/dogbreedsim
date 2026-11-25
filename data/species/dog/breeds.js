// 体型分类
export const SIZE_CLASSES = {

    small: {
        name: "小型",
        rank: 0
    },

    medium: {
        name: "中型",
        rank: 1
    },

    large: {
        name: "大型",
        rank: 2
    },

    giant: {
        name: "巨型",
        rank: 3
    }

};


export const DOG_BREEDS = {
  "chihuahua": {
    "id": "chihuahua",
    "name": "吉娃娃",
    "species": "dog",
    "size": "small",
    "rarity": "common",
    "weightRange": {
      "min": 1.5,
      "max": 3
    },
    "baseStats": {
      "STR": 30,
      "SPD": 90,
      "STA": 50,
      "AGI": 110,
      "INT": 70,
      "PER": 100
    }
  },
  "pomeranian": {
    "id": "pomeranian",
    "name": "博美犬",
    "species": "dog",
    "size": "small",
    "rarity": "common",
    "weightRange": {
      "min": 2,
      "max": 3.5
    },
    "baseStats": {
      "STR": 35,
      "SPD": 75,
      "STA": 65,
      "AGI": 95,
      "INT": 80,
      "PER": 100
    }
  },
  "yorkshire_terrier": {
    "id": "yorkshire_terrier",
    "name": "约克夏犬",
    "species": "dog",
    "size": "small",
    "rarity": "common",
    "weightRange": {
      "min": 2,
      "max": 3.2
    },
    "baseStats": {
      "STR": 40,
      "SPD": 80,
      "STA": 75,
      "AGI": 95,
      "INT": 75,
      "PER": 85
    }
  },
  "maltese": {
    "id": "maltese",
    "name": "马尔济斯犬",
    "species": "dog",
    "size": "small",
    "rarity": "common",
    "weightRange": {
      "min": 3,
      "max": 4
    },
    "baseStats": {
      "STR": 35,
      "SPD": 80,
      "STA": 60,
      "AGI": 105,
      "INT": 90,
      "PER": 80
    }
  },
  "papillon": {
    "id": "papillon",
    "name": "蝴蝶犬",
    "species": "dog",
    "size": "small",
    "rarity": "common",
    "weightRange": {
      "min": 3,
      "max": 5
    },
    "baseStats": {
      "STR": 30,
      "SPD": 90,
      "STA": 65,
      "AGI": 115,
      "INT": 100,
      "PER": 50
    }
  },
  "toy_poodle": {
    "id": "toy_poodle",
    "name": "玩具贵宾犬",
    "species": "dog",
    "size": "small",
    "rarity": "common",
    "weightRange": {
      "min": 2,
      "max": 4
    },
    "baseStats": {
      "STR": 35,
      "SPD": 85,
      "STA": 70,
      "AGI": 100,
      "INT": 115,
      "PER": 45
    }
  },
  "corgi": {
    "id": "corgi",
    "name": "柯基犬",
    "species": "dog",
    "size": "medium",
    "rarity": "common",
    "weightRange": {
      "min": 9,
      "max": 14
    },
    "baseStats": {
      "STR": 60,
      "SPD": 75,
      "STA": 80,
      "AGI": 85,
      "INT": 85,
      "PER": 65
    }
  },
  "shiba_inu": {
    "id": "shiba_inu",
    "name": "柴犬",
    "species": "dog",
    "size": "medium",
    "rarity": "common",
    "weightRange": {
      "min": 8,
      "max": 12
    },
    "baseStats": {
      "STR": 55,
      "SPD": 90,
      "STA": 80,
      "AGI": 95,
      "INT": 60,
      "PER": 70
    }
  },
  "beagle": {
    "id": "beagle",
    "name": "比格犬",
    "species": "dog",
    "size": "medium",
    "rarity": "common",
    "weightRange": {
      "min": 9,
      "max": 14
    },
    "baseStats": {
      "STR": 50,
      "SPD": 75,
      "STA": 95,
      "AGI": 65,
      "INT": 45,
      "PER": 120
    }
  },
  "border_collie": {
    "id": "border_collie",
    "name": "边境牧羊犬",
    "species": "dog",
    "size": "medium",
    "rarity": "common",
    "weightRange": {
      "min": 14,
      "max": 20
    },
    "baseStats": {
      "STR": 45,
      "SPD": 90,
      "STA": 85,
      "AGI": 95,
      "INT": 120,
      "PER": 15
    }
  },
  "shetland_sheepdog": {
    "id": "shetland_sheepdog",
    "name": "喜乐蒂牧羊犬",
    "species": "dog",
    "size": "medium",
    "rarity": "common",
    "weightRange": {
      "min": 6,
      "max": 12
    },
    "baseStats": {
      "STR": 40,
      "SPD": 85,
      "STA": 75,
      "AGI": 100,
      "INT": 110,
      "PER": 40
    }
  },
  "cocker_spaniel": {
    "id": "cocker_spaniel",
    "name": "可卡犬",
    "species": "dog",
    "size": "medium",
    "rarity": "common",
    "weightRange": {
      "min": 10,
      "max": 15
    },
    "baseStats": {
      "STR": 45,
      "SPD": 75,
      "STA": 80,
      "AGI": 75,
      "INT": 70,
      "PER": 105
    }
  },
  "golden_retriever": {
    "id": "golden_retriever",
    "name": "金毛寻回犬",
    "species": "dog",
    "size": "large",
    "rarity": "common",
    "weightRange": {
      "min": 25,
      "max": 34
    },
    "baseStats": {
      "STR": 75,
      "SPD": 70,
      "STA": 85,
      "AGI": 55,
      "INT": 95,
      "PER": 70
    }
  },
  "labrador_retriever": {
    "id": "labrador_retriever",
    "name": "拉布拉多犬",
    "species": "dog",
    "size": "large",
    "rarity": "common",
    "weightRange": {
      "min": 25,
      "max": 36
    },
    "baseStats": {
      "STR": 80,
      "SPD": 65,
      "STA": 85,
      "AGI": 45,
      "INT": 80,
      "PER": 95
    }
  },
  "german_shepherd": {
    "id": "german_shepherd",
    "name": "德国牧羊犬",
    "species": "dog",
    "size": "large",
    "rarity": "common",
    "weightRange": {
      "min": 22,
      "max": 40
    },
    "baseStats": {
      "STR": 85,
      "SPD": 75,
      "STA": 75,
      "AGI": 60,
      "INT": 90,
      "PER": 65
    }
  },
  "husky": {
    "id": "husky",
    "name": "哈士奇",
    "species": "dog",
    "size": "large",
    "rarity": "common",
    "weightRange": {
      "min": 16,
      "max": 28
    },
    "baseStats": {
      "STR": 65,
      "SPD": 95,
      "STA": 120,
      "AGI": 65,
      "INT": 50,
      "PER": 55
    }
  },
  "samoyed": {
    "id": "samoyed",
    "name": "萨摩耶犬",
    "species": "dog",
    "size": "large",
    "rarity": "common",
    "weightRange": {
      "min": 20,
      "max": 30
    },
    "baseStats": {
      "STR": 70,
      "SPD": 75,
      "STA": 105,
      "AGI": 65,
      "INT": 65,
      "PER": 70
    }
  },
  "doberman": {
    "id": "doberman",
    "name": "杜宾犬",
    "species": "dog",
    "size": "large",
    "rarity": "common",
    "weightRange": {
      "min": 27,
      "max": 45
    },
    "baseStats": {
      "STR": 85,
      "SPD": 115,
      "STA": 65,
      "AGI": 80,
      "INT": 75,
      "PER": 30
    }
  },
  "saint_bernard": {
    "id": "saint_bernard",
    "name": "圣伯纳犬",
    "species": "dog",
    "size": "giant",
    "rarity": "rare",
    "weightRange": {
      "min": 54,
      "max": 82
    },
    "baseStats": {
      "STR": 120,
      "SPD": 45,
      "STA": 90,
      "AGI": 35,
      "INT": 65,
      "PER": 95
    }
  },
  "great_dane": {
    "id": "great_dane",
    "name": "大丹犬",
    "species": "dog",
    "size": "giant",
    "rarity": "common",
    "weightRange": {
      "min": 45,
      "max": 80
    },
    "baseStats": {
      "STR": 110,
      "SPD": 100,
      "STA": 65,
      "AGI": 55,
      "INT": 60,
      "PER": 60
    }
  },
  "newfoundland": {
    "id": "newfoundland",
    "name": "纽芬兰犬",
    "species": "dog",
    "size": "giant",
    "rarity": "common",
    "weightRange": {
      "min": 45,
      "max": 70
    },
    "baseStats": {
      "STR": 115,
      "SPD": 40,
      "STA": 110,
      "AGI": 35,
      "INT": 80,
      "PER": 70
    }
  },
  "tibetan_mastiff": {
    "id": "tibetan_mastiff",
    "name": "藏獒",
    "species": "dog",
    "size": "giant",
    "rarity": "common",
    "weightRange": {
      "min": 45,
      "max": 75
    },
    "baseStats": {
      "STR": 115,
      "SPD": 55,
      "STA": 85,
      "AGI": 40,
      "INT": 50,
      "PER": 105
    }
  },
  "great_pyrenees": {
    "id": "great_pyrenees",
    "name": "大白熊犬",
    "species": "dog",
    "size": "giant",
    "rarity": "common",
    "weightRange": {
      "min": 40,
      "max": 60
    },
    "baseStats": {
      "STR": 100,
      "SPD": 55,
      "STA": 100,
      "AGI": 40,
      "INT": 55,
      "PER": 100
    }
  },
  "bernese_mountain_dog": {
    "id": "bernese_mountain_dog",
    "name": "伯恩山犬",
    "species": "dog",
    "size": "giant",
    "rarity": "common",
    "weightRange": {
      "min": 35,
      "max": 55
    },
    "baseStats": {
      "STR": 105,
      "SPD": 55,
      "STA": 95,
      "AGI": 45,
      "INT": 85,
      "PER": 65
    }
  }
};
export const BREED_APPEARANCE = {
  "chihuahua": {
    "coatColor": {
      "normal": [
        "C01",
        "C02",
        "C03",
        "C05",
        "C07"
      ],
      "rare": [
        "C06",
        "C09"
      ],
      "mutation": [
        "C04",
        "C08",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1",
        "P2",
        "P3",
        "P6"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M02",
        "M03",
        "M05"
      ],
      "rare": [
        "M07"
      ],
      "mutation": [
        "M04",
        "M06",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E04",
        "E05"
      ],
      "mutation": [
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L1",
        "L3"
      ],
      "rare": []
    }
  },
  "pomeranian": {
    "coatColor": {
      "normal": [
        "C01",
        "C02",
        "C03",
        "C04",
        "C05",
        "C07",
        "C08"
      ],
      "rare": [
        "C06",
        "C09"
      ],
      "mutation": [
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1",
        "P2",
        "P3",
        "P6",
        "P5"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M02",
        "M03",
        "M05",
        "M07"
      ],
      "rare": [
        "M08"
      ],
      "mutation": [
        "M04",
        "M06",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E04",
        "E05"
      ],
      "mutation": [
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  },
  "yorkshire_terrier": {
    "coatColor": {
      "normal": [
        "C07",
        "C09"
      ],
      "rare": [
        "C10"
      ],
      "mutation": [
        "C01",
        "C02",
        "C03",
        "C04",
        "C05",
        "C06",
        "C08",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P1",
        "P2"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M04"
      ],
      "rare": [
        "M03"
      ],
      "mutation": [
        "M01",
        "M02",
        "M05",
        "M06",
        "M07",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02"
      ],
      "rare": [
        "E03"
      ],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  },
  "maltese": {
    "coatColor": {
      "normal": [
        "C01"
      ],
      "rare": [
        "C02"
      ],
      "mutation": [
        "C03",
        "C04",
        "C05",
        "C06",
        "C07",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01"
      ],
      "rare": [],
      "mutation": [
        "M02",
        "M03",
        "M04",
        "M05",
        "M06",
        "M07",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02"
      ],
      "rare": [
        "E03"
      ],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  },
  "papillon": {
    "coatColor": {
      "normal": [
        "C01"
      ],
      "rare": [],
      "mutation": [
        "C02",
        "C03",
        "C04",
        "C05",
        "C06",
        "C07",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P1",
        "P3"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M07",
        "M05"
      ],
      "rare": [
        "M04",
        "M06"
      ],
      "mutation": [
        "M01",
        "M02",
        "M03",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02"
      ],
      "rare": [
        "E03"
      ],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  },
  "toy_poodle": {
    "coatColor": {
      "normal": [
        "C01",
        "C02",
        "C03",
        "C05",
        "C06",
        "C07"
      ],
      "rare": [
        "C08",
        "C10"
      ],
      "mutation": [
        "C04",
        "C09",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1",
        "P2"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M03"
      ],
      "rare": [
        "M05"
      ],
      "mutation": [
        "M02",
        "M04",
        "M06",
        "M07",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E04"
      ],
      "mutation": [
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L2",
        "L3"
      ],
      "rare": []
    }
  },
  "corgi": {
    "coatColor": {
      "normal": [
        "C03",
        "C04",
        "C05",
        "C07"
      ],
      "rare": [],
      "mutation": [
        "C01",
        "C02",
        "C06",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P1",
        "P3",
        "P6"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M03",
        "M05"
      ],
      "rare": [
        "M07"
      ],
      "mutation": [
        "M02",
        "M04",
        "M06",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E04"
      ],
      "mutation": [
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L2",
        "L3"
      ],
      "rare": []
    }
  },
  "shiba_inu": {
    "coatColor": {
      "normal": [
        "C04",
        "C05",
        "C07"
      ],
      "rare": [
        "C02"
      ],
      "mutation": [
        "C01",
        "C03",
        "C06",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1",
        "P3",
        "P6"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M02",
        "M03"
      ],
      "rare": [
        "M07"
      ],
      "mutation": [
        "M04",
        "M05",
        "M06",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02"
      ],
      "rare": [
        "E03"
      ],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L2"
      ],
      "rare": []
    }
  },
  "beagle": {
    "coatColor": {
      "normal": [
        "C01",
        "C03",
        "C05",
        "C07"
      ],
      "rare": [
        "C06"
      ],
      "mutation": [
        "C02",
        "C04",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P1",
        "P3"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M03",
        "M05",
        "M07"
      ],
      "rare": [
        "M06"
      ],
      "mutation": [
        "M02",
        "M04",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L1"
      ],
      "rare": []
    }
  },
  "border_collie": {
    "coatColor": {
      "normal": [
        "C07",
        "C06",
        "C05",
        "C03"
      ],
      "rare": [
        "C09",
        "C11"
      ],
      "mutation": [
        "C01",
        "C02",
        "C04",
        "C08",
        "C10",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P1",
        "P3",
        "P5",
        "P6"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M03",
        "M05",
        "M07"
      ],
      "rare": [
        "M06",
        "M08"
      ],
      "mutation": [
        "M02",
        "M04",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03",
        "E04"
      ],
      "rare": [
        "E05"
      ],
      "mutation": [
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L1",
        "L2",
        "L3"
      ],
      "rare": []
    }
  },
  "shetland_sheepdog": {
    "coatColor": {
      "normal": [
        "C04",
        "C05",
        "C07"
      ],
      "rare": [
        "C09"
      ],
      "mutation": [
        "C01",
        "C02",
        "C03",
        "C06",
        "C08",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P1",
        "P3",
        "P6",
        "P5"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M03",
        "M05",
        "M07"
      ],
      "rare": [
        "M08"
      ],
      "mutation": [
        "M02",
        "M04",
        "M06",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03",
        "E04"
      ],
      "rare": [
        "E05"
      ],
      "mutation": [
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  },
  "cocker_spaniel": {
    "coatColor": {
      "normal": [
        "C02",
        "C04",
        "C05",
        "C06",
        "C07"
      ],
      "rare": [
        "C08"
      ],
      "mutation": [
        "C01",
        "C03",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1",
        "P2",
        "P3",
        "P4"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M03",
        "M05"
      ],
      "rare": [
        "M07",
        "M06"
      ],
      "mutation": [
        "M02",
        "M04",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E04"
      ],
      "mutation": [
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L2",
        "L3"
      ],
      "rare": []
    }
  },
  "golden_retriever": {
    "coatColor": {
      "normal": [
        "C03",
        "C04"
      ],
      "rare": [
        "C02",
        "C05"
      ],
      "mutation": [
        "C01",
        "C06",
        "C07",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01"
      ],
      "rare": [],
      "mutation": [
        "M02",
        "M03",
        "M04",
        "M05",
        "M06",
        "M07",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02"
      ],
      "rare": [
        "E03"
      ],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L2",
        "L3"
      ],
      "rare": []
    }
  },
  "labrador_retriever": {
    "coatColor": {
      "normal": [
        "C02",
        "C03",
        "C04",
        "C06",
        "C07"
      ],
      "rare": [
        "C05"
      ],
      "mutation": [
        "C01",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01"
      ],
      "rare": [],
      "mutation": [
        "M02",
        "M03",
        "M04",
        "M05",
        "M06",
        "M07",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E05"
      ],
      "mutation": [
        "E04",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L1"
      ],
      "rare": []
    }
  },
  "german_shepherd": {
    "coatColor": {
      "normal": [
        "C07",
        "C03",
        "C04",
        "C05"
      ],
      "rare": [
        "C08",
        "C01"
      ],
      "mutation": [
        "C02",
        "C06",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P2",
        "P6",
        "P7"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M07",
        "M03",
        "M05"
      ],
      "rare": [
        "M08"
      ],
      "mutation": [
        "M01",
        "M02",
        "M04",
        "M06",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E04"
      ],
      "mutation": [
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L2",
        "L3"
      ],
      "rare": []
    }
  },
  "husky": {
    "coatColor": {
      "normal": [
        "C07",
        "C08",
        "C05",
        "C06"
      ],
      "rare": [
        "C01",
        "C10"
      ],
      "mutation": [
        "C02",
        "C03",
        "C04",
        "C09",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1",
        "P6"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M02"
      ],
      "rare": [
        "M07",
        "M08"
      ],
      "mutation": [
        "M03",
        "M04",
        "M05",
        "M06",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03",
        "E04",
        "E05"
      ],
      "rare": [],
      "mutation": [
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L2",
        "L3"
      ],
      "rare": []
    }
  },
  "samoyed": {
    "coatColor": {
      "normal": [
        "C01"
      ],
      "rare": [
        "C02"
      ],
      "mutation": [
        "C03",
        "C04",
        "C05",
        "C06",
        "C07",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M02"
      ],
      "rare": [
        "M03"
      ],
      "mutation": [
        "M01",
        "M04",
        "M05",
        "M06",
        "M07",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02"
      ],
      "rare": [
        "E03"
      ],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  },
  "doberman": {
    "coatColor": {
      "normal": [
        "C07",
        "C06"
      ],
      "rare": [
        "C09",
        "C11"
      ],
      "mutation": [
        "C01",
        "C02",
        "C03",
        "C04",
        "C05",
        "C08",
        "C10",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P2"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M05"
      ],
      "rare": [
        "M04"
      ],
      "mutation": [
        "M01",
        "M02",
        "M03",
        "M06",
        "M07",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E05"
      ],
      "mutation": [
        "E04",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L1"
      ],
      "rare": []
    }
  },
  "saint_bernard": {
    "coatColor": {
      "normal": [
        "C01"
      ],
      "rare": [],
      "mutation": [
        "C02",
        "C03",
        "C04",
        "C05",
        "C06",
        "C07",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P1",
        "P3"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M05",
        "M04"
      ],
      "rare": [
        "M06"
      ],
      "mutation": [
        "M01",
        "M02",
        "M03",
        "M07",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E04"
      ],
      "mutation": [
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L1",
        "L3"
      ],
      "rare": []
    }
  },
  "great_dane": {
    "coatColor": {
      "normal": [
        "C01",
        "C07",
        "C03",
        "C04"
      ],
      "rare": [
        "C09",
        "C08"
      ],
      "mutation": [
        "C02",
        "C05",
        "C06",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1",
        "P4",
        "P5",
        "P7"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M07"
      ],
      "rare": [
        "M08",
        "M09"
      ],
      "mutation": [
        "M02",
        "M03",
        "M04",
        "M05",
        "M06",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03",
        "E04"
      ],
      "rare": [
        "E05"
      ],
      "mutation": [
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L1"
      ],
      "rare": []
    }
  },
  "newfoundland": {
    "coatColor": {
      "normal": [
        "C07",
        "C06"
      ],
      "rare": [
        "C08",
        "C01"
      ],
      "mutation": [
        "C02",
        "C03",
        "C04",
        "C05",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M01",
        "M07"
      ],
      "rare": [
        "M06",
        "M08"
      ],
      "mutation": [
        "M02",
        "M03",
        "M04",
        "M05",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  },
  "tibetan_mastiff": {
    "coatColor": {
      "normal": [
        "C07",
        "C05",
        "C04",
        "C03"
      ],
      "rare": [
        "C09",
        "C02"
      ],
      "mutation": [
        "C01",
        "C06",
        "C08",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P2",
        "P6"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M05",
        "M03",
        "M04"
      ],
      "rare": [
        "M07"
      ],
      "mutation": [
        "M01",
        "M02",
        "M06",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  },
  "great_pyrenees": {
    "coatColor": {
      "normal": [
        "C01"
      ],
      "rare": [],
      "mutation": [
        "C02",
        "C03",
        "C04",
        "C05",
        "C06",
        "C07",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P0",
        "P1"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M08",
        "M02",
        "M03"
      ],
      "rare": [
        "M05"
      ],
      "mutation": [
        "M01",
        "M04",
        "M06",
        "M07",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02"
      ],
      "rare": [
        "E03"
      ],
      "mutation": [
        "E04",
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  },
  "bernese_mountain_dog": {
    "coatColor": {
      "normal": [
        "C07"
      ],
      "rare": [],
      "mutation": [
        "C01",
        "C02",
        "C03",
        "C04",
        "C05",
        "C06",
        "C08",
        "C09",
        "C10",
        "C11",
        "C12"
      ]
    },
    "pattern": {
      "normal": [
        "P3"
      ],
      "rare": []
    },
    "patternColor": {
      "normal": [
        "M05"
      ],
      "rare": [],
      "mutation": [
        "M01",
        "M02",
        "M03",
        "M04",
        "M06",
        "M07",
        "M08",
        "M09",
        "M10",
        "M11",
        "M12"
      ]
    },
    "eyeColor": {
      "normal": [
        "E01",
        "E02",
        "E03"
      ],
      "rare": [
        "E04"
      ],
      "mutation": [
        "E05",
        "E06"
      ]
    },
    "hairLength": {
      "normal": [
        "L3"
      ],
      "rare": []
    }
  }
};
// 获取指定犬种
export function getBreed(breedId) {

    return DOG_BREEDS[breedId];

}


// 获取全部犬种
export function getAllBreeds() {

    return Object.values(DOG_BREEDS);

}


// 获取犬种外貌基因池
export function getBreedAppearance(breedId) {

    return BREED_APPEARANCE[breedId];

}