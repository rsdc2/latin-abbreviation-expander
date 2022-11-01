// const fileInput = document.getElementById("input");
const expandBtn = document.getElementById("btnExpand");
const clearBtn = document.getElementById("btnClear");
// const setModelBtn = document.getElementById("setModelBtn")
function setModel() {
    document.getElementById("div_examples").style.visibility = "hidden";
    document.getElementById("ellipse_set_model").removeAttribute("hidden");
}
function expansionUIStart() {
    document.getElementById("div_expansions").removeAttribute("hidden");
    document.getElementById("div_examples").removeAttribute("hidden");
    document.querySelectorAll(".ellipse_expand").forEach((elem) => elem.removeAttribute("hidden"));
    document.getElementById("tbl_examples").innerHTML = "";
    document.getElementById("tbl_expansions").innerHTML = "";
    console.log('Expanding...');
}
function expansionUIEnd(expansionsHTML, examplesHTML) {
    document.querySelectorAll(".ellipse_expand").forEach((elem) => elem.setAttribute("hidden", ""));
    document.getElementById("tbl_examples").innerHTML = examplesHTML;
    document.getElementById("tbl_expansions").innerHTML = expansionsHTML;
    console.log('Expansion complete.');
}
function clearResultsUI() {
    document.getElementById("div_expansions").setAttribute("hidden", "");
    document.getElementById("div_examples").setAttribute("hidden", "");
    document.getElementById("tbl_examples").innerHTML = "";
    document.getElementById("tbl_expansions").innerHTML = "";
}
function clearSearchUI() {
    document.querySelectorAll("input.context").forEach((elem) => elem.value = "");
}
const arrToHTML = (tagname, newline, boldIdx, callbacks) => {
    const _arrToHTML = (arr) => {
        const itemToHTML = (acc, item, idx) => {
            // if (item === "<boundary>" || item === "<bovndary>" || lookupK2V[item.toString()] === "<boundary>" || lookupK2V[item.toString()] === "<bovndary>") {
            //     return `<${tagname}></${tagname}>`
            // }
            const newItem = callbacks ? [...callbacks].reverse().reduce((acc, func) => {
                return func(acc);
            }, item) : item;
            const boldItem = boldIdx && idx === boldIdx ? `<b>${newItem}</b>` : newItem;
            const html = acc.concat(`<${tagname}>${boldItem}</${tagname}>`);
            if (newline) {
                return html.concat("\n");
            }
            return html;
        };
        return arr.reduce(itemToHTML, "");
    };
    return _arrToHTML;
};
function disableButtons() {
    document.querySelectorAll(".btn").forEach((elem) => elem.setAttribute("disabled", "disabled"));
}
function enableButtons() {
    document.querySelectorAll(".btn").forEach((elem) => elem.removeAttribute("disabled"));
}
function exampleExactSearch() {
    document.querySelector('#exactRadio').setAttribute("checked", "checked");
    const [prevPrevInput, prevInput, abbrInput, nextInput, nextNextInput] = ["txtPrevPrev", "txtPrev", "txtAbbr", "txtNext", "txtNextNext"]
        .map((item) => document.getElementById(item));
    prevInput.value = "faciendum";
    abbrInput.value = "c";
    expandBtn.click();
}
function exampleRegexSearch() {
    document.querySelector('#regexRadio').setAttribute("checked", "checked");
    const [prevPrevInput, prevInput, abbrInput, nextInput, nextNextInput] = ["txtPrevPrev", "txtPrev", "txtAbbr", "txtNext", "txtNextNext"]
        .map((item) => document.getElementById(item));
    prevInput.value = "^faciend.+";
    abbrInput.value = "c";
    expandBtn.click();
}
function startLoad() {
    console.log("Start load.");
    document.querySelectorAll(".abbrExpander").forEach((elem) => elem.setAttribute("hidden", "hidden"));
    document.querySelectorAll("div#loading").forEach((elem) => elem.removeAttribute("hidden"));
}
function endLoad() {
    document.querySelectorAll(".abbrExpander#div_context").forEach((elem) => elem.removeAttribute("hidden"));
    document.querySelectorAll(".abbrExpander#notes").forEach((elem) => elem.removeAttribute("hidden"));
    document.querySelectorAll("#loading").forEach((elem) => elem.setAttribute("hidden", "hidden"));
    console.log("End load.");
}
function showAbbrExpander() {
    document.querySelectorAll(".abbrExpander#div_context").forEach((elem) => elem.removeAttribute("hidden"));
}
function getContextualVariables(parseMode, searchMode) {
    const vectorizeFunc = vectorize(parseMode, searchMode);
    const [prevPrevInput, prevInput, abbrInput, nextInput, nextNextInput] = ["txtPrevPrev", "txtPrev", "txtAbbr", "txtNext", "txtNextNext"]
        .map((item) => document.getElementById(item));
    const [prevPrevVal, prevVal, abbrVal, nextVal, nextNextVal] = [prevPrevInput, prevInput, abbrInput, nextInput, nextNextInput]
        .map((item) => vectorizeFunc(item.value.toLowerCase().replace("u", "v")));
    const matchInfos = [
        { field: "prev_prev", value: prevPrevVal },
        { field: "prev", value: prevVal },
        { field: "abbr", value: abbrVal },
        { field: "next", value: nextVal },
        { field: "next_next", value: nextNextVal }
    ];
    return matchInfos;
}
function getAbbr(parseMode, abbr) {
    if (parseMode === ParseMode.Vectors) {
        if (typeof (abbr) == "string") {
            if (abbr.match('[a-zA-Z]+')) {
                return parseInt(lookupV2K[abbr]);
            }
            else if (abbr.match('[0-9]+')) {
                return parseInt(abbr);
            }
        }
        else if (typeof (abbr) == "number") {
            return abbr;
        }
    }
    else if (parseMode === ParseMode.Strings) {
        return abbr;
    }
    return null;
}
function toUpper(s) {
    if (typeof (s) === "number") {
        return s.toString().toUpperCase();
    }
    return s.toUpperCase();
}
function replace(searchValue, replaceValue) {
    const _replace = (s) => {
        if (typeof (s) === "number") {
            return s.toString().replace(searchValue, replaceValue);
        }
        return s.replace(searchValue, replaceValue);
    };
    return _replace;
}
expandBtn.onclick = (e) => {
    clearResultsUI();
    const searchModeElement = document.querySelector('input[name="search_type"]:checked');
    const searchMode = searchModeElement.value;
    const parseMode = lookupK2V === undefined ? ParseMode.Strings : ParseMode.Vectors;
    const devectorizeFunc = devectorize(parseMode, searchMode);
    const vectorizeFunc = vectorize(parseMode, searchMode);
    const replaceFunc = replace("U", "V");
    const matchInfos = getContextualVariables(parseMode, searchMode);
    const contextVars = matchInfos.filter((matchInfo) => matchInfo.value != "" && matchInfo.value !== undefined && matchInfo.field != "abbr");
    const abbrPos = matchInfos.findIndex((item) => item.field === "abbr");
    const preContextVarStrs = matchInfos.reduce((acc, item, idx) => {
        return idx < abbrPos && item.value !== "" ? acc.concat(devectorizeFunc(item.value)) : acc;
    }, []);
    const postContextVarStrs = matchInfos.reduce((acc, item, idx) => {
        return idx > abbrPos && item.value !== "" ? acc.concat(devectorizeFunc(item.value)) : acc;
    }, []);
    const abbr = getAbbr(parseMode, matchInfos.filter((matchInfo) => matchInfo.field === "abbr")[0].value);
    if (abbr === null) {
        return;
    }
    expansionUIStart();
    // Filter examples
    const abbrFilter = parseMode === ParseMode.Strings ? df['abbr'].eq(abbr) : df['abbr'].eq(abbr);
    const filterFunc = reduceFilter(searchMode, parseMode);
    const filter = contextVars.reduce(filterFunc, abbrFilter);
    const filteredDf = filter == null ? df : df.query(filter);
    const rowFunc = arrToHTML("tr", true);
    const examplesCellFunc = arrToHTML("td", false, 3, [replaceFunc, toUpper, devectorizeFunc]);
    const examplesHTML = getTableArr(filteredDf, tableFields, rowFunc, examplesCellFunc);
    // Expansions
    const expansionProbs = predictProbs(contextVars, abbr, searchMode, parseMode);
    const expansionRowsArr = expansionProbs.index.map(function getExpansionsRowArr(idxName, idxPos) {
        const prob = expansionProbs.iloc([idxPos]).values[0];
        return [[idxPos + 1], preContextVarStrs, [devectorizeFunc(idxName)], postContextVarStrs].flat();
    });
    const cellFunc = arrToHTML("td", false, preContextVarStrs.length + 1, [replaceFunc, toUpper]);
    const expansionsHTML = rowFunc(expansionRowsArr.map((cols) => cellFunc(cols)));
    // Output
    expansionUIEnd(expansionsHTML, examplesHTML);
};
function load(loadMode) {
    disableButtons();
    startLoad();
    const jsonVals = Object.values(data);
    df = new dfd.DataFrame(jsonVals);
    console.log('Data loaded.');
    switch (loadMode) {
        case LoadMode.trainModel: {
            model = trainBasicModel(trainFields, df);
            console.log('Model trained.');
            break;
        }
        case (LoadMode.loadModel): {
            // model = deserializeModel(serializedModel)
            model = serializedModel;
            if (lookupK2V) {
                lookupV2K = invertObj(lookupK2V);
            }
            if (columnsK2V) {
                columnsV2K = invertObj(columnsK2V);
            }
            console.log("Model loaded");
        }
    }
    df.rename(columnsK2V, { inplace: true });
    enableButtons();
    endLoad();
}
load(LoadMode.loadModel);