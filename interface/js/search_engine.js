var RESULT_PER_PAGE = 10
var HOST = "localhost"
var PORT = "8081"

var BASE_URL = "http://" + HOST + ":" + PORT

window.onload = function() {
    localStorage.setItem("searchType", 0)

    document.getElementById("search-btn").addEventListener("click", function() {
        clear()
        var element = document.getElementById("search-input");

        if(element.value.length === 0) {
            return;
        }
        
        localStorage.setItem("query", element.value)

        sendSearchQuery(0, RESULT_PER_PAGE, true)
    });

    document.getElementById("ordinary-search").addEventListener("click", function() {
        var selectedSearch = document.getElementById("selected-search-type")
        selectedSearch.innerHTML = "Избрано търсене: Обикновено търсене";
        localStorage.setItem("searchType", 0)
    });

    document.getElementById("advanced-search").addEventListener("click", function() {
        var selectedSearch = document.getElementById("selected-search-type")
        selectedSearch.innerHTML = "Избрано търсене: Разширено търсене";
        localStorage.setItem("searchType", 1)
    });

    document.getElementById("export-excel-btn").addEventListener("click", function() {
        var value = localStorage.getItem("query")
        var type = parseInt(localStorage.getItem("searchType"))
        
        if(type == 0) {
            window.open(BASE_URL + "/export_excel_ordinary?search_query=" + value + "&from=0&size=10000")
        } else if(type == 1) {
            window.open(BASE_URL + "/export_excel_advanced?search_query=" + value + "&from=0&size=10000")
        }
    });
    
    document.getElementById("export-pdf-btn").addEventListener("click", function() {
        var value = localStorage.getItem("query")
        var type = parseInt(localStorage.getItem("searchType"))
        
        if(type == 0) {
            window.open(BASE_URL + "/export_pdf_ordinary?search_query=" + value + "&from=0&size=10000")
        } else if(type == 1) {
            window.open(BASE_URL + "/export_pdf_advanced?search_query=" + value + "&from=0&size=10000")
        }
    });

    $(document).keypress(function(e){
        if (e.which == 13){
            $("#search-btn").click();
        }
    });

    document.getElementById("search-input").addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
            document.getElementById("search-btn").click();
        }
    });

    $(document).ready(function() {
        $(window).keydown(function(event){
            if(event.keyCode == 13) {
                event.preventDefault();
                return false;
            }
        });
    });
};

function sendSearchQuery(from, size, initial=false) {
    var query = localStorage.getItem("query")
    var type = parseInt(localStorage.getItem("searchType"))

    if(type == 0) {
        sendOrdinarySearchQuery(query, from, size, initial)
    } else if(type == 1) {
        sendAdvancedSearchQuery(query, from, size, initial)
    }
}

function sendOrdinarySearchQuery(value, from, size, initial) {
    if(initial) {
        ajax(BASE_URL + "/ordinary_search/count?search_query=" + value, {}, buildPages)
    }
    
    ajax(BASE_URL + "/ordinary_search?search_query=" + value + "&from=" + from + "&size=" + size, {}, fillTable)
}

function sendAdvancedSearchQuery(value, from, size, initial) {
    if(initial) {
        ajax(BASE_URL + "/advanced_search/count?search_query=" + value, {}, buildPages)
    }
    
    ajax(BASE_URL + "/advanced_search?search_query=" + value + "&from=" + from + "&size=" + size, {}, fillTable)
}

function clear() {
    clearTable()
    clearPages()
    var type = localStorage.getItem("searchType")
    localStorage.clear()
    localStorage.setItem("searchType", type)
}

function clearTable() {
    var table = document.querySelector("#files-container");

    if (!table.classList.contains("non-visible")) {
        table.classList.add("non-visible");
    }

    document.querySelector("#main-table tbody").innerHTML = "";
}

function clearPages() {
    document.querySelector("#pages").innerHTML = "";
}

function clearTableRows() {
    document.querySelector("#main-table tbody").innerHTML = "";
}

function openFile(filePath) {
    window.open(BASE_URL + "/open?path=" + filePath, "_blank");
}