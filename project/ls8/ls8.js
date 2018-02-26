const fs = require('fs');
const RAM = require('./ram');
const CPU = require('./cpu');

/**
 * Process a loaded file
 */
function processFile(content, cpu, onComplete) {
    // Pointer to the memory address in the CPU that we're
    // loading a value into:
    let curAddr = 0;
    
    // Split the lines of the content up by newline
    const lines = content.split('\n');

    // Loop through each line of machine code

    for (let line of lines) {
        const comment = line.indexOf('#');

        // If we found one, cut off everything after
        if (comment != -1) {
        line = line.substr(0, comment);
        }

        // Remove whitespace from either end
        line = line.trim();

        if (line === '') {
        // Line was blank or only a comment
        continue;
        }

        // At this point, the line should just be the 1s and 0s

        // Convert from binary string to number
        const binValue = parseInt(line, 2); // Base 2 == binary

        // Check to see if the parsing failed
        if (isNaN(binValue)) {
        console.error('Invalid binary number: ' + line);
        process.exit(1);
        }

        // Ok, we have a good value, so store it into memory:
        //console.log(`storing ${binValue}, ${line}`);
        cpu.poke(curAddr, binValue);
        
        curAddr++;
    }

    onComplete(cpu);
}

/**
 * Load the instructions into the CPU from stdin
 */
function loadFileFromStdin(cpu, onComplete) {
    let content = '';

    // Read everything from standard input, stolen from:
    // https://stackoverflow.com/questions/13410960/how-to-read-an-entire-text-stream-in-node-js
    process.stdin.resume();
    process.stdin.on('data', function(buf) { content += buf.toString(); });
    process.stdin.on('end', () => { processFile(content, cpu, onComplete); });
}

/**
 * Load the instructions into the CPU from a file
 */
function loadFile(filename, cpu, onComplete) {
    const content = fs.readFileSync(filename, 'utf-8');
    processFile(content, cpu, onComplete);
}

/**
 * On File Loaded
 * 
 * CPU is set up, start it running
 */
function onFileLoaded(cpu) {
    cpu.startClock();
}

/**
 * Main
 */

let ram = new RAM(256);
let cpu = new CPU(ram);

// Get remaining command line arguments
const argv = process.argv.slice(2);

// Check arguments
if (argv.length === 0) {
    // Read from stdin
    loadFileFromStdin(cpu, onFileLoaded);
} else if (argv.length == 1) {
    // Read from file
    loadFile(argv[0], cpu, onFileLoaded);
} else {
    console.error('usage: ls8 [machinecodefile]');
    process.exit(1);
}
