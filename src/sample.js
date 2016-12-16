var fs = require('fs');
var MIDIFile = require('./MIDIFile');
var MIDIFileHeader = require('./MIDIFileHeader')
var path = require('path');

// map for MIDI standard notes
var noteHash = {
	0: "C-2",
	1: "C#/Db-2",
	2: "D-2",
	3: "D#/Eb-2",
	4: "E-2",
	5: "F-2",
	6: "F#/Gb-2",
	7: "G-2",
	8: "G#/Ab-2",
	9: "A-2",
	10: "A#/Bb-2",
	11: "B-2",
	12: "C-1",
	13: "C#/Db-1",
	14: "D-1",
	15: "D#/Eb-1",
	16: "E-1",
	17: "F-1",
	18: "F#/Gb-1",
	19: "G-1",
	20: "G#/Ab-1",
	21: "A-1",
	22: "A#/Bb-1",
	23: "B-1",
	24: "C0",
	25: "C#/Db0",
	26: "D0",
	27: "D#/Eb0",
	28: "E0",
	29: "F0",
	30: "F#/Gb0",
	31: "G0",
	32: "G#/Ab0",
	33: "A0",
	34: "A#/Bb0",
	35: "B0",
	36: "C1",
	37: "C#/Db1",
	38: "D1",
	39: "D#/Eb1",
	40: "E1",
	41: "F1",
	42: "F#/Gb1",
	43: "G1",
	44: "G#/Ab1",
	45: "A1",
	46: "A#/Bb1",
	47: "B1",
	48: "C2",
	49: "C#/Db2",
	50: "D2",
	51: "D#/Eb2",
	52: "E2",
	53: "F2",
	54: "F#/Gb2",
	55: "G2",
	56: "G#/Ab2",
	57: "A2",
	58: "A#/Bb2",
	59: "B2",
	60: "C3",
	61: "C#/Db3",
	62: "D3",
	63: "D#/Eb3",
	64: "E3",
	65: "F3",
	66: "F#/Gb3",
	67: "G3",
	68: "G#/Ab3",
	69: "A3",
	70: "A#/Bb3",
	71: "B3",
	72: "C4",
	73: "C#/Db4",
	74: "D4",
	75: "D#/Eb4",
	76: "E4",
	77: "F4",
	78: "F#/Gb4",
	79: "G4",
	80: "G#/Ab4",
	81: "A4",
	82: "A#/Bb4",
	83: "B4",
	84: "C5",
	85: "C#/Db5",
	86: "D5",
	87: "D#/Eb5",
	88: "E5",
	89: "F5",
	90: "F#/Gb5",
	91: "G5",
	92: "G#/Ab5",
	93: "A5",
	94: "A#/Bb5",
	95: "B5",
	96: "C6",
	97: "C#/Db6",
	98: "D6",
	99: "D#/Eb6",
	100: "E6",
	101: "F6", 
	112: "F#/Gb6",
	103: "G6", 
	104: "G#/Ab6",
	105: "A6",
	106: "A#/Bb6",
	107: "B6",
	108: "C7",
	109: "C#/Db7",
	110: "D7",
	111: "D#/Eb7", 
	112: "E7",
	113: "F7", 
	114: "F#/Gb7",
	115: "G7",
	116: "G#/Ab7",
	117: "A7",
	118: "A#/Bb7",
	119: "B7",
	120: "C8",
	121: "C#/Db8", 
	122: "D8",
	123: "D#/Eb8", 
	124: "E8",
	125: "F8",
	126: "F#/Gb8",
	127: "G8"
}

// because Array Buffers!
function toArrayBuffer(buffer) {
  var ab = new ArrayBuffer(buffer.length);
  var view = new Uint8Array(ab);
  var i;

  for (i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return ab;
}


// create a sample MIDIFile by reading in a .mid file from the sounds directory
var mf = new MIDIFile(toArrayBuffer(
      fs.readFileSync(path.join(__dirname, '..', 'sounds', 'twinkle.mid'))
    ));

// using events so far, but trackEvents allows you to specify a particular track
var events = mf.getMidiEvents();
var trackEvents = mf.getTrackEvents(1);

// bools for troubleshooting
var isFirst = false;
var isSecond = false;

// some information found in the header of the midi file
var midiFormat = mf.header.getFormat();
var trackCount = mf.header.getTracksCount();

if(mf.header.getTimeDivision() === MIDIFileHeader.TICKS_PER_BEAT) {
    var ticksPerBeat = mf.header.getTicksPerBeat();
} else {
    var SMPTEFrames = mf.header.getSMPTEFrames();
    var ticksPerFrame = mf.header.getTicksPerFrame();
}

// compile the header information
var midiObject = {
	midiFormat: midiFormat,
	trackCount: trackCount,
	ticksPerBeat: ticksPerBeat || null,
	SMPTEFrames: SMPTEFrames || null,
	ticksPerFrame: ticksPerFrame || null
}


console.log("midiObject: ", midiObject)

// seperate the noteOns from the noteOffs, then combine them into 'notes' 
var notesOn = [];
var notesOff = [];

for(i in events) {

	// noteOn
	if(events[i].subtype == 9 && events[i].channel == 1) {
		if(isFirst === false) {
		console.log("First (9): ", events[i])
	}
		isFirst = true
		notesOn.push(events[i])
	}


	// noteOff
	if(events[i].subtype == 8 && events[i].channel == 1) {
		if(isSecond === false) {
		console.log("First (8): ", events[i])
	}
		isSecond = true
		notesOff.push(events[i])
	}

}

var notes = [];
var currentNote = {};
var emptyNote = {};
var totalLengthInBeats = 0;
var playedNotes = 0;
var silentNotes = 0;

// combine On/Off to create a "note" object w/ pertinent information
for(var i = 0; i < notesOn.length; i++) {

	currentNoteLengthInBeats = notesOff[i].delta / midiObject.ticksPerBeat;

	if(currentNoteLengthInBeats > 0.5 && currentNoteLengthInBeats < 1) {
		currentNoteLengthInBeats = Math.round(currentNoteLengthInBeats)
	}

	currentNote = {
		pitch: notesOn[i].param1,
		pitchAsLetter: noteHash[notesOn[i].param1],
		velocity: notesOn[i].param2,
		startTime: notesOn[i].playTime,
		endTime: notesOff[i].playTime,
		lengthInTicks: notesOff[i].delta,
		lengthInBeats: currentNoteLengthInBeats
	}
	if(i > 0 && currentNote.startTime !== notesOff[i-1].playTime) {

		 emptyNote = {
			pitch: "",
			pitchAsLetter: null,
			velocity: null,
			startTime: notesOff[i-1].playTime,
			endTime: currentNote.startTime,
			lengthInTicks: notesOn[i].delta,
			lengthInBeats: notesOn[i].delta / midiObject.ticksPerBeat
		}
		notes.push(emptyNote)
		totalLengthInBeats += emptyNote.lengthInBeats;
		silentNotes += 1;
	}
	notes.push(currentNote);
	totalLengthInBeats += currentNote.lengthInBeats;
	playedNotes += 1;

}


// some info
console.log("Example note: \n", notes[0])
console.log("Total Notes: ", notes.length)
console.log("Total (played) Notes: ", playedNotes)
console.log("Total (silence) Notes: ", silentNotes)
console.log("Total Beats: ", totalLengthInBeats)



for(i in notes) {
	// display note, then read the lengthInBeats and 'wait' for that amount of time before displaying the next note

	// for now just represents noteLength in dashes


	var numDashes = notes[i].lengthInBeats*4
	var dashString = ''
	for(var j = 0; j < numDashes; j++) {
		dashString+='-';
	}
	console.log(notes[i].pitchAsLetter, dashString)


}


