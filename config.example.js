module.exports = {
    "log_level": 1, //1 = Production, 2 = Debug

    "http_port": 3000,
    "data_dir": __dirname + "/data",
    "id_bytes": 4, //More = Longer ID,
    "delete_after": 72 //Delete files after certain amount of hours since creation. 0 = Disabled
}