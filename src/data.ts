
function filterSeriesArrString( seriesStringArr:SeriesArr<string>, predicateFunc: ( pair: [string, string] ) => boolean ): SeriesArr<boolean> {
    const indexValuePairs = seriesStringArr.index.map( (indexItem:string, indexItemPos:number) => [indexItem, seriesStringArr.values[indexItemPos]] )

    const returnVal = indexValuePairs.reduce( 
        (acc:SeriesArr<boolean>, matchPair: [string, string]) => {
            acc.index.push(matchPair[0])
            acc.values.push(predicateFunc(matchPair))
            return acc
        }, {index: [], values: []})

    return returnVal
}

/**
 * Returns a function that returns the specified columns from a DanfoJS DataFrame row
 * If callback is specified, callback 
 * @param colNames 
 * @returns 
 */
function rowToAry(colNames:string[], callback?: <T>(callbackAry: T[]) => any): string | number | any {

    function _colsToAry <T>(row): any {

        function colRedFunc <T>(acc: T[], colName:string): T[]  {
            const newAcc: T[] = [...acc]
            const cellVal = row.at(row.index[0], colName)
            newAcc.push(cellVal)
            return newAcc
        }    

        const initial: T[] = []
        const innerAry: T[] = colNames.reduce(colRedFunc, initial)

        if (callback) {
            return callback(innerAry)
        }
        
        return innerAry
    }
    
    return _colsToAry
}

function invertObj(obj:object) {
    return Object.entries(obj).reduce( 
        (obj: Object, [k, v]) => {
            obj[v] = k
            return obj
        }, 
    {})      
}


const tableToRowsAry = <T, A>(df:DataFrame, callback?: (ary:T[]) => A)  => {
    const rowMapFunc = (rowIdx: number) => {
        const rowNumber = {rows: [rowIdx]}
        const row = df.iloc(rowNumber)
        return row
    }

    const arrayIndices = [...Array(df.index.length).keys()]

    const rowsAry = arrayIndices.map(rowMapFunc)
    if (callback) {
        return callback(rowsAry)
    }
    return rowsAry
}

const getTableArr = (df: DataFrame, colNames:string[], rowCallback, cellCallback):any => {
    const rowsAry: any[] = tableToRowsAry(df)
    const rowsColAry = rowsAry.map(rowToAry(colNames, cellCallback))
    return rowCallback(rowsColAry)
}


function getCombinations(colName:string, colNames:string[]):string[][] {

    function recFunc(acc: string[][], head:string[], tail:string[]): string[][] {
        const newHead = Array.from(head)
        if (tail.length === 0) {
            acc.push(head)
            return acc.sort()
        }
        if (tail.length === 1) {
            newHead.push(tail.slice(0)[0])
            acc.push(newHead)
            return acc.sort()
        }
        newHead.push(tail.slice(0)[0])
        acc.push(newHead)
        return recFunc(acc, newHead, tail.slice(1))
    }

    return recFunc([[colName]], [colName], colNames.filter((x) => x != colName))
}


function permute(colNames:string[]):string[][] {

    function permuteMapFunc(colName:string):string[] {

        function recFunc(head:string[], tail:string[]): string[] {
            const newHead = Array.from(head)
            if (tail.length === 0) {
                return head
            }
            if (tail.length === 1) {
                newHead.push(tail.slice(0)[0])
                return newHead
            }
            newHead.push(tail.slice(0)[0])
            return recFunc(newHead, tail.slice(1))
        }

    
        const head = [colName]
        const tail = colNames.filter((x) => x != colName)

        return recFunc(head, tail)
    }

    return colNames.map(permuteMapFunc)

}

function getPivotFromObj(obj:object, divby?:number): DataFrame {
    const indexVals:string[] = Object.keys(obj)
    const colNames = Object.values(obj).reduce( 
        (acc, cellObj) => {
            acc.push(Object.keys(cellObj))
            return acc
        }, [] ).flat()
    
    const colNamesListSet = Array.from(new Set(colNames))
    
    function getColData(indexItem:string, indexPos:number) {
        const colVals = new Array(colNamesListSet.length).fill(0)
        
        Object.entries(obj).map( 
            ([index, collocObj], pos:number)  => {
                Object.entries(collocObj).map( ([colName, freq]: [string, number]) => {
                    if (index === indexItem) {
                        const arrIdxForColName = colNamesListSet.indexOf(colName)
                        if (divby) {
                            colVals[arrIdxForColName] = freq / divby
                        } else {
                            colVals[arrIdxForColName] = freq
                        }
                    }   
                })
            }
        )
        return colVals
    }
    
    const arr = indexVals.map(getColData)
    const pivot = new dfd.DataFrame(arr, {index: indexVals, columns: colNamesListSet})
    return pivot

}

function getPivotFromDF(_df?:DataFrame, indexSource?:string, colSource?:string, divby?:number): DataFrame {

    const index = Array.from(new Set(_df[indexSource].values))
    const colNames = Array.from(new Set(_df[colSource].values))

    function getColData(indexItem:string, indexPos:number) {
        const colVals = new Array(colNames.length).fill(0)
        
        _df['text'].values.map( (idx:string, pos:number)  => {
            if (idx === indexItem) {
                const colItem = _df.iat(pos, 1) 
                const cellVal = _df.iat(pos, 2)
                const arrIdxForColItem = colNames.indexOf(colItem)
                if (divby) {
                    colVals[arrIdxForColItem] = cellVal / divby
                } else {
                    colVals[arrIdxForColItem] = cellVal
                }
                
            }
        })
        return colVals
    }

    const arr = index.map(getColData)
    const pivot = new dfd.DataFrame(arr, {index: index, columns: colNames})
    return pivot
}

function trainBasicModel(colNames:string[], dfTrain) {
    const df = dfTrain

    function contextVariableRedFunc(accContext, colName:string) {

        function abbrRedFunc(accAbbr, abbr:string) {
            const filter = df['abbr'].eq(abbr)
            const filteredDf = df.query(filter)
            const grp = filteredDf.groupby(['text', colName])

            const grpCount = grp.agg({ref:"count"})
            const pivot = getPivotFromDF(grpCount, 'text', colName, filteredDf.index.length)
            // const pivotRelativeFreqs = pivot.div(filteredDf.index.length)

            if (!Object.keys(accAbbr).includes(colName)) {
                accAbbr[colName] = {}
            }

            accAbbr[colName][abbr] = pivot
            //console.log(abbr)
            return accAbbr
        }
        
        const abbrsSet:Set<string> = new Set(df['abbr'].values)
        const abbrsAry = Array.from(abbrsSet)
        return abbrsAry.reduce(abbrRedFunc, accContext)
    }

    const modelForAllAbbrs = colNames.reduce(contextVariableRedFunc, {})
    return modelForAllAbbrs
}

function isOnlyZeros(series:Series):boolean {
    const filter = series.eq(0) 
    const filterVals = filter.values

    return !filterVals.includes(false)
}

function getPivotTable(seriesesObj: object | DataFrame):DataFrame {
    // Frequency table already expanded to pivot table dataframe
    if (seriesesObj.hasOwnProperty("$columns")) {
        return seriesesObj as DataFrame
    }
    const firstVal = Object.values(Object.values(seriesesObj)[0])[0]
    // Frequency table
    if (typeof(firstVal) === "number") {
        const pivotDf = getPivotFromObj(seriesesObj)

        return pivotDf

    // Pivot table
    } else if (typeof(firstVal) === "object") {
        const serieses: Series[] = Object.entries(seriesesObj).reduce(
            ( accSeries: Series[], [columnName, seriesArr]: [string, SeriesArr<number>] ): Series[] => {
                const series: Series = new dfd.Series(seriesArr.values, {index: seriesArr.index, columns: [columnName]}) 
                accSeries.push(series)
                return accSeries
            }
        , [])

        const df: DataFrame = dfd.concat({dfList: serieses, axis:1}).setIndex({index: serieses[0].index})
    

// const df: DataFrame = new dfd.DataFrame(jsonData, {index: Object.keys(jsonData[0])})

        return df
    }
}

function predictProbs(contextVars:MatchInfo[], abbr:string | number, searchMode:SearchMode, parseMode:ParseMode): Series {

    function getSeries(df: DataFrame, contextVarValue:string): Series {

        switch (searchMode) {
            case "exact": {
                return df[contextVarValue]
                
            } 
            case "regex": {
                const dfColumns: string[] = df.columns

                const columns = dfColumns.filter( (column:string) => {
                    const devectorizedColumn = parseMode === ParseMode.Vectors ? lookupK2V[column] : column
                    return devectorizedColumn.match(contextVarValue) 
                })
        
                if (columns.length === 0) {
                    return undefined
                } 

                const series = columns.reduce( (acc:any, column:string) => {
                    if (acc === null) {
                        return df[column]
                    }
        
                    return acc.add(df[column])
        
                }, null )
        
                return series.div(columns.length)    
            }
        }
    }

    function getProbSeries(accProbSeries: Series, contextVar: MatchInfo): Series {

        const abbrData = model[abbr]
        if (abbrData === undefined) { // i.e. abbreviation not in the database
            return accProbSeries
        }
        
        if (!Object.keys(abbrData).includes(contextVar.field)) {
            return accProbSeries
        }        
        
        const contextFieldData: DataFrame | Object = abbrData[contextVar.field]
        const contextFieldDataPivot = getPivotTable(contextFieldData)
        const collocSeries = getSeries(contextFieldDataPivot, contextVar.value)

        if (collocSeries === undefined) {
            return accProbSeries
        }

        if (isOnlyZeros(collocSeries)) {
            return accProbSeries
        }

        if (accProbSeries == null) {
            return collocSeries
        }

        return collocSeries.mul(accProbSeries)
    }

    const expansionProbs = contextVars.reduce(getProbSeries, null)
    
    if (expansionProbs === null) {
        return new dfd.Series()
    }

    const sortedExpansionProbs = expansionProbs.sortValues({ascending: false})
    
    const filtered:SeriesArr<number> = sortedExpansionProbs.index.reduce( (acc:SeriesArr<number>, idxName:string, idxPos:number):SeriesArr<number> => {
        const value:number = sortedExpansionProbs.iloc([idxPos]).values[0]
        if (value > 0) {
            acc.index.push(idxName)
            acc.values.push(value)
            return acc
        }
        return acc
    }, {index: [], values: []})

    const sortedFilteredExpansionProbs = new dfd.Series(filtered.values, {index: filtered.index})

    return sortedFilteredExpansionProbs
}






function reduceFilter(searchMode: SearchMode, parseMode: ParseMode) {

    function reduceFilterRegex(filterAcc: Series, matchInfo: MatchInfo): Series {
        
        if (matchInfo.value == "") {
            return filterAcc
        }

        const series = parseMode === ParseMode.Vectors ? df[matchInfo.field].map(lookupK2V) : df[matchInfo.field]

        if (filterAcc == null) {
            // return parseMode === ParseMode.Vectors ? series.eq(parseInt(matchInfo.value)) : series.eq(matchInfo.value)
            return series
        }
    
        const filter = regexMatch(series, matchInfo)
        return filterAcc.and(filter)
    }

    function reduceFilterExact(filterAcc: Series, matchInfo:MatchInfo): Series {
        if (matchInfo.value == "") {
            return filterAcc
        }
    //    const series = parseMode === ParseMode.Vectors ? df[matchInfo.field].map(lookup) : df[matchInfo.field]
        const series = df[matchInfo.field]
    
        if (filterAcc == null) {
            return parseMode === ParseMode.Vectors ? series.eq(parseInt(matchInfo.value)) : series.eq(matchInfo.value)
        }
    
        const filter = parseMode === ParseMode.Vectors ? series.eq(parseInt(matchInfo.value)) : series.eq(matchInfo.value)
        return filterAcc.and(filter)
    }

    const matchFunc = searchMode === "regex" ? reduceFilterRegex : reduceFilterExact
    return matchFunc
}

/**
 * Returns a series of boolean values based on regex match
 * @param series 
 * @param matchInfo 
 */

function regexMatch(series:Series, matchInfo:MatchInfo): Series {
    const seriesArr: SeriesArr<string> = {
        index: series.index,
        values: series.values
    }
    
    const resultSeriesArr = filterSeriesArrString(seriesArr, ([index, value]) => value.match(matchInfo.value) !== null)
    
    const returnSeries = new dfd.Series(resultSeriesArr.values, {index: resultSeriesArr.index})
    return returnSeries
}

function serializeModel(m: Object): string {

    const modelJSON: Object = Object.entries(m).reduce( 

        ( abbrAccObj: Object, [abbr, abbrModel]: [string, Object]) => {
            
            const contextFieldModelJSON: Object = Object.entries(abbrModel).reduce( 
                ( contextFieldAccObj: Object, [contextField, contextFieldDf]: [string, DataFrame], idx: number, modelForAbbr: [string, DataFrame][] ) => {

                    const columns = contextFieldDf.columns
                    //const index = abbrDf.index

                    const serieses = columns.reduce( (seriesAcc: Object, column:string, idx:number, columns: string[]) => {
                        const series: Series = contextFieldDf[column]
                        seriesAcc[column] = {index: series.index, values: series.values} 
                        return seriesAcc
                    }, {} )

                    // const dfJSON: string = dfd.toJSON(abbrDf, {format: "row"})
                    // console.log(abbr)
                    // console.log(dfJSON)
                    // abbrDf.print()

                    abbrAccObj[abbr] = serieses
                    return abbrAccObj
            }, {})

        abbrAccObj[abbr] = contextFieldModelJSON
        return abbrAccObj
    }, {})

    return JSON.stringify(modelJSON)
}

function deserializeModel(m: Object): Object {

    const modelObj: Object = Object.entries(m).reduce( 

        (contextFieldAccObj: Object, [contextField, contextFieldModel]: [string, Object]) => {

            const abbrModelJSON: Object = Object.entries(contextFieldModel).reduce( 
                ( abbrAccObj: Object, [abbr, seriesesObj]: [string, Object], idx: number, modelForContextField: [string, Object][] ): Object => {

                    const firstVal = Object.values(Object.values(seriesesObj)[0])[0]
                    // Frequency table
                    if (typeof(firstVal) === "number") {
                        const pivotDf = getPivotFromObj(seriesesObj)
                        // abbrAccObj[abbr] = {index: Object.keys(seriesesObj), values: Object.values(seriesesObj)}
                        // return abbrAccObj
                        abbrAccObj[abbr] = pivotDf
                        return abbrAccObj
                    // Pivot table
                    } else if (typeof(firstVal) === "object") {
                        const serieses: Series[] = Object.entries(seriesesObj).reduce(
                            ( accSeries: Series[], [columnName, seriesArr]: [string, SeriesArr<number>] ): Series[] => {
                                const series: Series = new dfd.Series(seriesArr.values, {index: seriesArr.index, columns: [columnName]}) 
                                // const seriesDf: DataFrame = new dfd.DataFrame(seriesArr.values, {index: seriesArr.index, columns: [columnName]})
                                accSeries.push(series)
                                return accSeries
                            }
                        , [])
    
                        const df: DataFrame = dfd.concat({dfList: serieses, axis:1}).setIndex({index: serieses[0].index})
                    
    
                // const df: DataFrame = new dfd.DataFrame(jsonData, {index: Object.keys(jsonData[0])})
    
                        abbrAccObj[abbr] = df
                        return abbrAccObj
                    }
                }, {})

            contextFieldAccObj[contextField] = abbrModelJSON
            return contextFieldAccObj
    }, {})

    return modelObj
}


function vectorize(parseMode: ParseMode, searchMode: SearchMode) {

    function _vectorize(value: string | number) {
        if (value == "") {
            return ""
        }

        if (parseMode === ParseMode.Vectors && searchMode !== "regex") {
            return lookupV2K[value]
        }
        // if (typeof(value) === "string") {
        //     return parseInt(value)    
        // }
        return value
    }

    return _vectorize
}

function devectorize(parseMode: ParseMode, searchMode: SearchMode) {

    function _devectorize(value: string | number) {
        if (parseMode === ParseMode.Vectors ) {
            const lookupVal = lookupK2V[value] 
            if (lookupVal === undefined) {
                return value
            } 
            if (lookupVal.includes("boundary") || lookupVal.includes("bovndary")) {
                return ""
            }
            return lookupVal
            
        }
        return value
    }

    return _devectorize
}