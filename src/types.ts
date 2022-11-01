// const dfd = require("danfojs-node");
declare const dfd: any

const tableFields = ["ref", "prev_prev", "prev", "text", "next", "next_next"]
const trainFields = ["prev_prev", "prev", "text", "next", "next_next"]

type SearchMode = "exact" | "regex"
// type LoadMode = "trainModel" | "loadModel"

enum LoadMode {
    trainModel = "trainModel",
    loadModel = "loadModel"
}

enum ParseMode {
    Vectors = "Vectors",
    Strings = "Strings"
}

interface MatchInfo {
    field:string,
    value:string
}

class SeriesArr<T extends string | number | boolean> {
    index: string[]
    values: T[]
}

// interface CollocFreq {

// }

// interface FreqTableObj {
//     index: 
// }

declare class Series {
    index
    values
    and(filter: Series)
    sortValues({})
    mul(operand: Series)
    iloc([])
    eq(filter: Series | number | string)
}

declare class DataFrame {
    index: number[]
    iloc: any
    columns: any[]
    toJSON(): string
    print(): void
    iat(x:number, y:number)
}

type StringOrNumber<T extends string | number> = T