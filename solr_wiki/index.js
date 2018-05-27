const fs = require('fs')
const readline = require('readline')
const stream = require('stream')
const request = require('sync-request')

let documents = []

// read file through fs readstream
const instream = fs.createReadStream('simplewiki.json') // simplewiki file has to be named 'simplewiki.json'
const outstream = new stream
const rl = readline.createInterface(instream, outstream)

// do this for every line in the stream
rl.on('line', function(line) {
    // only every second line is interesting -> lines starting with index are not interesting
    if(line.substring(0, 8) == '{"index"') return
    else {
        // extract only the relevant properties of the input JSON file
        const lineJson = JSON.parse(line);
        const outJson = {}

        // write relevant properties to output JSON file
        outJson["aux_txt_sort"] = lineJson.auxiliary_text
        outJson["title_txt_en"] = lineJson.title
        outJson["text_txt_en"] = lineJson.text
        outJson["heading_txt_sort"] = lineJson.heading
        outJson["link_txt_sort"] = lineJson.outgoing_link
        outJson["popu_f"] = lineJson.popularity_score
        // opening_text is optional
        if(lineJson.opening_text) outJson["opening_txt_en"] = lineJson.opening_text
        else outJson["opening_txt_en"] = ""
        // coordinates is optional
        if(lineJson.coordinates) outJson["location"] = lineJson.coordinates
        else outJson["location"] = []
        
        //accumulate JSON objects before they are sent
        accumData(outJson)
        
    }
})

// send rest of Data when filestream is over
// otherwise the last <10k Objects are not sent
rl.on('close', function() {
    sendData(documents)
    documents = []
});

// accumulates JSON objects in array until 10k before they are sent
function accumData(postData) {
    documents.push(postData)
    if(documents.length == 10000){
        // send array of JSON objects to solr server
        console.log('sending')
        sendData(documents)
        documents = []
    }
}

// sends data to solr server
function sendData(postData){
    var clientServerOptions = {
        body: JSON.stringify(postData),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    }
    // on response from server, log response
    let response = request('POST', 'http://localhost:8983/solr/gettingstarted/update/json/docs?commit=true&overwrite=true', clientServerOptions);
    if (response.statusCode !== 200) {
      throw(response.body)
    } else {
      console.log('sent')
    }
}
