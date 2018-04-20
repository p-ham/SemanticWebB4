const resources = './resources/'
const fs = require('fs')
const readline = require('readline')

// init readline package
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//entry point
getVocabulary(getQuery)

//creates vocabulary from resource files
function getVocabulary(callback) {
    const vocabulary = new Object()
    fs.readdir(resources, (err, files) => {
        files.forEach(file => {
            fs.readFile(resources + file, 'utf-8', function(err, data) {
                if (err) throw err
                let words = data.split(" ")
                for (i = 0; i < words.length; i++) {
                    let word = words[i].replace(/[^a-zA-Z ]/g, "").toLowerCase()
                    if(!vocabulary[word]) vocabulary[word] = new Array()
                    vocabulary[word].push(file)
                }
                //call getQuery function with finished vocabulary
                if(file == files[files.length-1]) callback(null, vocabulary)
            })
        })
    })
}

//readline, in case of no input -> close program
function getQuery(err, content) {
    rl.question('Geben sie einen Search Query ein! (leere Eingabe zum Beenden)\n', (query) => {
        if(query.length > 0) getResults(query, err, content)
        else rl.close()
    }) 
}

function getResults(query, err, content) {
    const terms = query.split(" ")
    let results;
    //check in which files each search term is contained
    for (i = 0; i < terms.length; i++) {
        let term = terms[i].replace(/[^a-zA-Z ]/g, "").toLowerCase()
        //term is in dictionary?
        if(content[term]) {
            //first result
            if(!results) results = content[term]
            else if (results != "no match found for: \"" + query + "\"")
                //only save files all previous terms have in common
                results = results.diff(content[term])
        } else {
            results = "no match found for: \"" + query + "\""
        }
    }
    //
    if(results.length == 0) results = "no match found for: \"" + query + "\""
    //result output
    console.log("\"" + query + "\" wurde gefunden in: [" + results + "]")
    //try another query
    getQuery(err, content)   
}

// finds matches between 2 arrays
// from https://stackoverflow.com/questions/12433604/how-can-i-find-matching-values-in-two-arrays
Array.prototype.diff = function(arr2) {
    var ret = [];
    this.sort();
    arr2.sort();
    for(var i = 0; i < this.length; i += 1) {
        if(arr2.indexOf(this[i]) > -1){
            ret.push(this[i]);
        }
    }
    return ret;
};