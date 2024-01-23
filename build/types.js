const tableFields = ["ref", "prev_prev", "prev", "text", "next", "next_next"];
const trainFields = ["prev_prev", "prev", "text", "next", "next_next"];
var LoadMode;
(function (LoadMode) {
    LoadMode["trainModel"] = "trainModel";
    LoadMode["loadModel"] = "loadModel";
})(LoadMode || (LoadMode = {}));
var ParseMode;
(function (ParseMode) {
    ParseMode["Vectors"] = "Vectors";
    ParseMode["Strings"] = "Strings";
})(ParseMode || (ParseMode = {}));
class SeriesArr {
    index;
    values;
}
