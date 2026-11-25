// 五个独立遗传位点
export const APPEARANCE_LOCI = {
    coatColor: "基础毛色",
    pattern: "花纹类型",
    patternColor: "花纹颜色",
    eyeColor: "眼睛颜色",
    hairLength: "毛发长度"
};


export const APPEARANCE_GENES = {
  "coatColor": {
    "C01": {
      "name": "白",
      "dominance": 12,
      "hex": "#F8F5ED"
    },
    "C02": {
      "name": "奶油",
      "dominance": 11,
      "hex": "#EBDDB8"
    },
    "C03": {
      "name": "浅黄",
      "dominance": 10,
      "hex": "#DDB779"
    },
    "C04": {
      "name": "金黄",
      "dominance": 7,
      "hex": "#C99548"
    },
    "C05": {
      "name": "红棕",
      "dominance": 3,
      "hex": "#AC5937"
    },
    "C06": {
      "name": "深棕",
      "dominance": 2,
      "hex": "#62412F"
    },
    "C07": {
      "name": "黑",
      "dominance": 1,
      "hex": "#29282B"
    },
    "C08": {
      "name": "灰",
      "dominance": 6,
      "hex": "#929294"
    },
    "C09": {
      "name": "蓝灰",
      "dominance": 5,
      "hex": "#687987"
    },
    "C10": {
      "name": "银灰",
      "dominance": 9,
      "hex": "#C4C6CA"
    },
    "C11": {
      "name": "浅棕灰",
      "dominance": 8,
      "hex": "#B0A096"
    },
    "C12": {
      "name": "浅雾紫",
      "dominance": 4,
      "hex": "#D9CDE7",
      "mutationOnly": true
    }
  },
  "pattern": {
    "P0": {
      "name": "纯色",
      "dominance": 8
    },
    "P1": {
      "name": "双色",
      "dominance": 1
    },
    "P2": {
      "name": "眉点",
      "dominance": 3
    },
    "P3": {
      "name": "三色",
      "dominance": 2
    },
    "P4": {
      "name": "斑点",
      "dominance": 6
    },
    "P5": {
      "name": "陨石纹",
      "dominance": 7
    },
    "P6": {
      "name": "覆色",
      "dominance": 4
    },
    "P7": {
      "name": "面罩",
      "dominance": 5
    }
  },
  "patternColor": {
    "M01": {
      "name": "白",
      "dominance": 1,
      "hex": "#F8F5ED"
    },
    "M02": {
      "name": "奶油",
      "dominance": 8,
      "hex": "#EBDDB8"
    },
    "M03": {
      "name": "浅黄",
      "dominance": 7,
      "hex": "#DDB779"
    },
    "M04": {
      "name": "金黄",
      "dominance": 3,
      "hex": "#C99548"
    },
    "M05": {
      "name": "红棕",
      "dominance": 2,
      "hex": "#AC5937"
    },
    "M06": {
      "name": "深棕",
      "dominance": 6,
      "hex": "#62412F"
    },
    "M07": {
      "name": "黑",
      "dominance": 5,
      "hex": "#29282B"
    },
    "M08": {
      "name": "灰",
      "dominance": 9,
      "hex": "#929294"
    },
    "M09": {
      "name": "蓝灰",
      "dominance": 10,
      "hex": "#687987"
    },
    "M10": {
      "name": "银灰",
      "dominance": 11,
      "hex": "#C4C6CA"
    },
    "M11": {
      "name": "浅棕灰",
      "dominance": 12,
      "hex": "#B0A096"
    },
    "M12": {
      "name": "灰紫",
      "dominance": 4,
      "hex": "#8D739F",
      "mutationOnly": true
    }
  },
  "eyeColor": {
    "E01": {
      "name": "深棕",
      "dominance": 1,
      "hex": "#493124"
    },
    "E02": {
      "name": "浅棕",
      "dominance": 4,
      "hex": "#94603A"
    },
    "E03": {
      "name": "琥珀",
      "dominance": 5,
      "hex": "#C49B45"
    },
    "E04": {
      "name": "蓝",
      "dominance": 2,
      "hex": "#8AB8D5"
    },
    "E05": {
      "name": "灰蓝",
      "dominance": 6,
      "hex": "#84969F"
    },
    "E06": {
      "name": "翡翠绿",
      "dominance": 3,
      "hex": "#37846B",
      "mutationOnly": true
    }
  },
  "hairLength": {
    "L1": {
      "name": "短毛",
      "dominance": 1
    },
    "L2": {
      "name": "中毛",
      "dominance": 2
    },
    "L3": {
      "name": "长毛",
      "dominance": 3
    }
  }
};
// 获取基因信息
export function getGene(locus, alleleId) {

    return APPEARANCE_GENES[locus]?.[alleleId];

}


// 判断是否为专属突变色
export function isMutationOnlyGene(locus, alleleId) {

    return getGene(locus, alleleId)
        ?.mutationOnly === true;

}


// 获取某个位点的全部专属突变色
export function getMutationAlleles(locus) {

    const genes = APPEARANCE_GENES[locus] ?? {};

    return Object.entries(genes)

        .filter(
            ([id, gene]) => gene.mutationOnly === true
        )

        .map(
            ([id]) => id
        );

}