const resources = './resources/'
const fs = require('graceful-fs')
const readline = require('readline')

// init readline package
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

//entry point
getVocabulary(computeIdf)

//creates vocabulary from resource files
function getVocabulary(callback) {
    console.log("Creating Vocabulary...")
    const vocabulary = new Map()
    fs.readdir(resources, (err, files) => {
        files.forEach(file => {
            fs.readFile(resources + file, 'utf-8', function(err, data) {
                if (err) throw err
                let words = data.split(" ")
                for (i = 0; i < words.length; i++) {
                    let word = words[i].replace(/[^a-zA-Z ]/g, "").toLowerCase()
                    // create word in vocabulary
                    if(!vocabulary.get(word)) {
                        vocabulary.set(word, new Object())
                        vocabulary.get(word).files = new Map()
                    }
                    // create file in word in vocabulary
                    if(!vocabulary.get(word).files.get(file)) vocabulary.get(word).files.set(file, 0)
                    vocabulary.get(word).files.set(file, vocabulary.get(word).files.get(file) + 1)
                }
                //call getQuery function with finished vocabulary
                if(file == files[files.length-1]) {
                    console.log("Vocabulary created!")
                    callback(null, vocabulary, files.length)
                }
            })
        })
    })
}

function computeIdf(err, content, numdocs) {
    // compute idf scores for each word in dictionary
    content.forEach(function(value, word, map) {
        content.get(word).idf = numdocs / value.files.size
    })
    getQuery(err, content)
}

//readline, in case of no input -> close program
function getQuery(err, content) {
    rl.question('[31mGeben sie einen Search Query ein! (leere Eingabe zum Beenden)[39m\n', (query) => {
        if(query.length > 0) getResults(query, err, content)
        else rl.close()
    }) 
}

function getResults(query, err, content) {

    const terms = query.split(" ")
    let results = new Array()
    //check in which files each search term is contained
    for (i = 0; i < terms.length; i++) {
        let term = terms[i].replace(/[^a-zA-Z ]/g, "").toLowerCase()
        //term is in dictionary?
        if(content.has(term)) {
            content.get(term).files.forEach(function(value, key, map) {
                let inResults = false;
                // check if file is already save for this term
                for(j = 0; j < results.length; j++) {
                    if(results[j].file == key) inResults = j
                }
                // create object with terms map
                if(inResults === false) {
                    let terms = new Map()
                    // compute score for word
                    terms.set(term, content.get(term).files.get(key) * content.get(term).idf)
                    results.push({file: key, terms: terms})
                } else {
                    // add to terms map
                    results[inResults].terms.set(term, content.get(term).files.get(key) * content.get(term).idf)
                }
            }) 
        }
    }

    // add scores
    for(i = 0; i < results.length; i++) {
        let score = 0.0;
        results[i].terms.forEach(function(value, key, map) {
            results[i].terms.set(key, Math.round(results[i].terms.get(key), 0))
            score += results[i].terms.get(key)
        }) 
        results[i].score = score
    }

    // sort by score
    results.sort(function(a, b){
        return b.score - a.score
    });

    // log results to console "[3Xm" & [39m = color codes
    if(results.length > 5) console.log(`\n[32mFound ${results.length} results, showing top 5[39m\n`)
    else console.log(`\n[32mFound ${results.length} results[39m\n`)
    for(i = 0; i < results.length; i++) {
        if(i >= 5) break
        console.log(`[35m\"${results[i].file}\":[39m [33mscore ${results[i].score}[39m`)
        results[i].terms.forEach(function(value, key, map) {
            console.log(`[31m${key}[39m [36m${value}[39m`)
        }) 
        console.log('')
    }


    //try another query
    getQuery(err, content)   
}