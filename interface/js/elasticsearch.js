function buildPages(response) {
    if (response.status == 200 && response.response) {
        var parsed = JSON.parse(response.response);
        var count = parsed.count
        localStorage.setItem("hitsCount", count)

        if(count > 0) {
            var numberOfPages = Math.ceil(count / RESULT_PER_PAGE)
            localStorage.setItem("numberOfPages", numberOfPages)
            localStorage.setItem("currentPage", 1)

            doBuild(numberOfPages)
            updateActivePage(1)
        }
    }
}

function doBuild(numberOfPages) {
    var pages = document.querySelector("#pages")

    var left = buildPage("&laquo;", function() {
        currentPage = localStorage.getItem("currentPage")
        goToPage(parseInt(currentPage) - 1)
    })

    var right = buildPage("&raquo;", function() {
        currentPage = localStorage.getItem("currentPage")
        goToPage(parseInt(currentPage) + 1)
    })

    pages.appendChild(left)

    currentPage = parseInt(localStorage.getItem("currentPage"))
    numberOfPages = parseInt(localStorage.getItem("numberOfPages"))

    for (i = 1; i <= numberOfPages; i++) {
        var page = buildPage(i, function() {
            goToPage(this.innerHTML)
        })

        pages.appendChild(page)
    }
    
    pages.appendChild(right)
}

function buildPage(text, event) {
    var page = document.createElement("a")
    page.innerHTML = text
    page.href = "#"
    page.addEventListener("click", event)
    return page
}

function goToPage(page) {
    numberOfPages = parseInt(localStorage.getItem("numberOfPages"))

    console.log("page:" + page + " nump:" + numberOfPages)
    if(page < 1 || page > numberOfPages) {
        return
    }

    localStorage.setItem("currentPage", page)
    clearTableRows()

    var skip = (page - 1) * RESULT_PER_PAGE
    sendSearchQuery(skip, RESULT_PER_PAGE)
    updateActivePage(page)
}

function fillTable(response) {
    if (response.status == 200 && response.response) {
        var results = JSON.parse(response.response);
        populate(results)
    }
}

function populate(results) {
    var table_container = document.querySelector("#files-container")
    var hits = results.hits.hits

    if (hits.length > 0 && table_container.classList.contains("non-visible")) {
        table_container.classList.remove("non-visible");
    }

    tableBody = document.querySelector("#main-table tbody");

    for(var i = 0; i < hits.length; i++) {
        var path = hits[i]._source.path
        var snippet = getHighlight(hits[i])

        var tr = document.createElement("tr");
        populateRow(tr, path, snippet)
        tableBody.appendChild(tr);
    }
}

function getHighlight(value) {
    if(value && value.highlight && value.highlight.content[0]) {
        return value.highlight.content[0]
    } else {
        return null
    }
}

function populateRow(tr, path, snippet) {
    tr.appendChild(createTD(path, snippet));
}

function createTD(path, snippet) {
    var col = document.createElement("td");
    col.classList.add("column1");
    var filePathContainer = document.createElement("div")

    filePathContainer.classList.add("file-path")

    var linkToFile = document.createElement("a")
    linkToFile.innerHTML = path
    linkToFile.href = "#"
    linkToFile.addEventListener("click", function() {
        openFile(path)
    })

    var textNode = document.createElement("b");
    textNode.innerHTML = "Файл: "

    filePathContainer.appendChild(textNode)
    filePathContainer.appendChild(linkToFile)

    var snippetContainer = document.createElement("div")
    var bTitleSnippet = document.createElement("b");

    var snippetContent = document.createElement("p")
    snippetContent.innerHTML = (snippet != null ? "<b>Откъс: </b>" + snippet : "")

    snippetContainer.appendChild(bTitleSnippet)
    snippetContainer.appendChild(snippetContent)

    col.appendChild(filePathContainer)
    col.appendChild(snippetContainer)

    return col;
}

function updateActivePage(page) {
    pages = document.querySelector("#pages");

    for(i = 0; i < pages.children.length; i++) {
        pages.children[i].classList.remove("active")
        if(i == page) {
            pages.children[i].classList.add("active")
        }
    }
}

