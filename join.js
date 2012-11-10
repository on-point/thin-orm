// a join model
function Join(name) {
    this.name = name;
    this.criteria = null;
    this.table = null;
    this.map = null;
    this.type = this.ONE_TO_ONE;
    this.default = false;
}

Join.ONE_TO_ONE = "ONE_TO_ONE";
Join.ONE_TO_MANY = "ONE_TO_MANY";

module.exports = Join;