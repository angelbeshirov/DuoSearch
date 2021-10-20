const express = require("express")
const bodyParser = require("body-parser")
const url = require('url');
const elasticsearch = require("elasticsearch")
const fileSystem = require('fs')
const pathModule = require('path');
const pdfGenerator = require('pdfkit')
const xl = require('excel4node')
const converter = require('./converter')
const app = express()

app.use(bodyParser.json())

app.listen(process.env.PORT || 8081, () => {
    console.log("connected")
})

const client = elasticsearch.Client({
    host: "localhost:9200",
})

// Add headers
app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'localhost:8080');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    next();
});

app.get("/ordinary_search", (req, res) => {
    const query = createOrdinarySearchQuery(req)
    client.search(query)
    .then(response => {
        return res.json(response)
    })
    .catch(err => {
        return res.status(500).json({"message": "Error"})
    })
})

app.get("/advanced_search", (req, res) => {
    const query = createAdvancedSearchQuery(req)
    client.search(query)
    .then(response => {
        return res.json(response)
    })
    .catch(err => {
        return res.status(500).json({"message": "Error"})
    })
})

app.get("/ordinary_search/count", (req, res) => {
    const value = req.query['search_query']
    const old_value = converter.convert(value)
    const query = {
        index: "library_index",
        body: {
            query: {
                bool : {
                    should: [{
                        match_phrase: {
                            "content": value.trim()
                        }
                    }, {
                        match_phrase: {
                            "content": old_value.trim()
                        }
                    }]
                }
            }
        }
    }
    client.count(query)
    .then(response => {
        return res.json(response)
    })
    .catch(err => {
        return res.status(500).json({"message": "Error"})
    })
})

app.get("/advanced_search/count", (req, res) => {
    const query_string = req.query['search_query']
    const converted_query_string = converter.convert(query_string)
    const query = {
        index: "library_index",
        body: {
            query: {
                bool : {
                    should: [{
                        query_string: {
                            query: query_string.trim(),
                            default_field: "content"
                        }
                    }, {
                        query_string: {
                            query: converted_query_string.trim(),
                            default_field: "content"
                        }
                    }]
                }
            }
        }
    }
    client.count(query)
    .then(response => {
        return res.json(response)
    })
    .catch(err => {
        return res.status(500).json({"message": "Error"})
    })
})

app.get("/open", (req, res) => {
    const path = req.query['path']

    var statistics = fileSystem.statSync(path);

    res.writeHead(200, {
        'Content-Length': statistics.size
    });

    var readStream = fileSystem.createReadStream(path);
    readStream.pipe(res);
})

app.get("/export_pdf_ordinary", (req, res) => {
    const query = createOrdinarySearchQuery(req, forExport = true)
    client.search(query)
    .then(response => {
        exportPdf(res, response)
    })
    .catch(err => {
        return res.status(500).json({"message": "Error"})
    })
})

app.get("/export_pdf_advanced", (req, res) => {
    const query = createAdvancedSearchQuery(req, forExport = true)
    client.search(query)
    .then(response => {
        exportPdf(res, response)
    })
    .catch(err => {
        return res.status(500).json({"message": "Error"})
    })
})

app.get("/export_excel_ordinary", (req, res) => {
    const query = createOrdinarySearchQuery(req, forExport = true)
    client.search(query)
    .then(response => {
        exportExcel(res, response)
    })
    .catch(err => {
        return res.status(500).json({"message": "Error"})
    })
})

app.get("/export_excel_advanced", (req, res) => {
    const query = createAdvancedSearchQuery(req, forExport = true)
    client.search(query)
    .then(response => {
        exportExcel(res, response)
    })
    .catch(err => {
        return res.status(500).json({"message": "Error"})
    })
})

function createOrdinarySearchQuery(req, forExport = false) {
    const value = req.query['search_query']
    const old_value = converter.convert(value)

    const from = req.query['from']
    const size = req.query['size']
    const query = {
        index: "library_index",
        body: {
            _source: ["path"],
            size: size,
            from: from,
            query: {
                bool : {
                    should: [{
                        match_phrase: {
                            "content": value.trim()
                        }
                    }, {
                        match_phrase: {
                            "content": old_value.trim()
                        }
                    }]
                }
            },
            highlight: {
                pre_tags: (forExport ?  [""] : ["<b>"]),
                post_tags: (forExport ?  [""] : ["</b>"]),
                order : "score",
                type : "unified",
                fields: {
                    content: {
                        fragment_size : 300,
                        number_of_fragments : 15
                    }
                }
            }
        }
    }
    return query;
}

function createAdvancedSearchQuery(req, forExport = false) {
    const query_string = req.query['search_query']
    const converted_query_string = converter.convert(query_string)
    const from = req.query['from']
    const size = req.query['size']

    const query = {
        index: "library_index",
        from: from,
        size: size,
        body: {
            _source: ["path"],
            query: {
                bool : {
                    should: [{
                        query_string: {
                            query: query_string.trim(),
                            default_field: "content"
                        }
                    }, {
                        query_string: {
                            query: converted_query_string.trim(),
                            default_field: "content"
                        }
                    }]
                }
            },
            highlight: {
                pre_tags: (forExport ?  [""] : ["<b>"]),
                post_tags: (forExport ?  [""] : ["</b>"]),
                order : "score",
                type : "unified",
                fields: {
                    content: {
                        fragment_size : 300,
                        number_of_fragments : 15
                    }
                }
            }
        }
    }
    return query;
}

function exportPdf(res, response) {
    var text = response.hits.hits

    let theOutput = new pdfGenerator 
    theOutput.registerFont('NotoSans', './fonts/NotoSans-Regular.ttf')
    const stream = theOutput.pipe(fileSystem.createWriteStream('Резултати.pdf', {encoding: 'utf8'}))
    
    let i;
    for (i = 0; i < text.length; i++) {
        let path = text[i]._source.path
        let content = text[i].highlight.content[0]

        theOutput.font('NotoSans')
        theOutput.text('Файл: ' + path, {
            underline: true,
            align: 'left'
        })
        theOutput.moveDown(0.5)
        theOutput.text('Откъс: ' + content)
        theOutput.moveDown(1)
    }
                
    theOutput.end()
            
    var file = pathModule.join('', 'Резултати.pdf');
            
    stream.on('finish', function() {
        res.download(file, function(err) {
            if (err) {
                console.log(err)
            }
        })
    })
}

function exportExcel(res, response) {
    var text = response.hits.hits

    let data = [];
    let i;
    for (i = 0; i < text.length; i++) {
        let path = text[i]._source.path
        let content = text[i].highlight.content[0]
        data.push({
            "Файл":path, 
            "Откъс":content
        })
    }

    var options = {
        'sheetFormat': {
            'baseColWidth': 80,
            'defaultColWidth': 80,
        }
    };

    const wb = new xl.Workbook()
    const ws = wb.addWorksheet("Резултати", options)

    const headingColumnNames = [
        "Файл",
        "Откъс"
    ]

    const cellStyle = wb.createStyle({
        alignment: {
            wrapText: true,
            horizontal: 'center'
        }
    })


    let headingColumnIndex = 1
    headingColumnNames.forEach(heading => {
        ws.cell(1, headingColumnIndex++).string(heading).style(cellStyle)
    })

    let rowIndex = 2
    data.forEach(record => {
        let columnIndex = 1
        Object.keys(record).forEach(columnName => {
            
            ws.cell(rowIndex, columnIndex++).string(record[columnName]).style(cellStyle)
        })
        rowIndex++
    })

    wb.write('Резултати.xlsx', function(err, stats) {
        if (err) {
          console.error(err);
        } else {
            const file = pathModule.join('', 'Резултати.xlsx');
            res.download(file, function(err) {
                if (err) {
                    console.log(err)
                }
            })
        }
    })
}
