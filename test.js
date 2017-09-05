// ==UserScript==
// @name        hubvim
// @namespace   rpasta42
// @include     /^https:\/\/github\.com\/.*\/.*\/edit\/.*$/
// @version     1
// @grant       none
// @require     https://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// ==/UserScript==

// @match       https://github.com/*


//console.log('hi');
// @include     https://github.com/*/*/edit/*
function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}
String.prototype.replaceAt=function(index, replacement) {
    return this.substr(0, index) + replacement + this.substr(index + replacement.length);
}
function appendHtml(sel, newHtml) {
  var currHtml = $(sel).html();
  $(sel).html(currHtml + newHtml);
}

function addCmdMode() {
  var cmdModeDiv = "<div style='z-index:10000;position:fixed;bottom:0;height:2em; background-color:black;width:100%' id='cmd-mode'></div>";

  appendHtml('body', cmdModeDiv);
  $('#cmd-mode').hide();
}



//CURSOR STUFF
function newCursor() {
  this.blinkFreq = 1000;
  this.cursorX = 0;
  this.cursorY = 0;
  this.origX = null;

  this.isOn = false;
  this.origChar = null;

  return this;
}

function getCurrLine(c) {
  var i = 0;

  var ret = null;

  $('.CodeMirror-line').each(function() {
    if (i++ == c.cursorY)
      ret = this;
  });

  return $(ret).find('span');
}

function getLineText(c) {
  return getCurrLine(c).text();
}

function getTotalLines() {
  var i = 0;

  $('.CodeMirror-line').each(function() {
    i++;
  });

  return i;
}

function renderCursor(c, newIsOn) {
  //$('.CodeMirror-code')

  if (c.cursorX < 0)
    c.cursorX = 0;
  if (c.cursorY < 0)
    c.cursorY = 0;


  var totalLines = getTotalLines();
  if (c.cursorY >= totalLines)
    c.cursorY = totalLines-1;

  var goodLineSpan = getCurrLine(c);
  if (!goodLineSpan) alert('bad line span1', goodLineSpan);

  var line = goodLineSpan.text();


  if (c.origX != null && c.origX < line.length) { //if curr line is shorter than prev line
    c.cursorX = c.origX;
    c.origX = null;
  }

  if (c.cursorX >= line.length) {

    if (c.cursorX > c.origX)
      c.origX = c.cursorX;

    c.cursorX = line.length - 1;
  }

  //console.log('c', c, '\nc.isOn', c.isOn, ' newIsOn:', newIsOn, '\ngood line:', goodLineSpan); console.log(line);

  if (!c.isOn)
    c.origChar = line[c.cursorX];

  if (newIsOn && !c.isOn) {
    line = line.replaceAt(c.cursorX, '■');
    c.isOn = true;
  }
  else if (!newIsOn && c.isOn) {
    line = line.replaceAt(c.cursorX, c.origChar);
    c.isOn = false;
  }
  else {
    //c.inRender = false;
    return;

  }
  //console.log('line:', line);
  goodLineSpan.text(line);

  //c.inRender = false;
}

function cursorBlink(c, i) {
  var newIsOn = !c.isOn;

  renderCursor(c, newIsOn);

  function cursorBlink_req() {
    cursorBlink(c, i+1);
  }

  //if (i < 15)
    window.setTimeout(cursorBlink_req, c.blinkFreq);
}

function setCursorPos(c, newX, newY) {
  if (offX < 0 || offY < 0)
    return;

  renderCursor(c, false);
  c.cursorX = newX;
  c.cursorY = newY;
  renderCursor(c, true);
}

function moveCursorPos(c, offX, offY) {
  var newX = c.cursorX + offX;
  var newY = c.cursorY + offY;
  if (newX < 0 || newY < 0)
    return;

  renderCursor(c, false);
  c.cursorX += offX;
  c.cursorY += offY;
  renderCursor(c, true);
}

function initCursor(cursor) {
  cursorBlink(cursor, 0);
}
///END CURSOR STUFF


function newConfig() {
  this.num_qualifier = null;
}

//distance until next word [+/- x, +/- y]
function m_w_word(c) {
  var line = getLineText(c);

  //firstPart = before cursor, secondPart = after cursor
  var firstPart = line.substring(0, c.cursorX);
  var secondPart = line.substring(c.cursorX, line.length);

  //split at current word end
  var secondPartSplitted = secondPart.split(' ');

  if (secondPartSplitted.length == 1)
    return [0, 1];

  //substring from cursor until next word
  var charsTilNextWord = secondPartSplitted[0];

  var numCharsTilNextWord = charsTilNextWord.length;

  return [numCharsTilNextWord, 0];
  //var nextWordIndex = firstPart.length + numCharsTilNextWord;
}

function m_b_word(c) {
  var line = getLineText(c);

  //firstPart = before cursor
  var fstPart = line.substring(0, c.cursorX);

  //split at current word end
  var fstPartSplitted = fstPart.split(' ');

  if (fstPartSplitted.length == 1) {
    if (c.cursorX == 0)
      return []
    return [0, 0];
  }

  //substring from cursor until next word
  var charsTilNextWord = secondPartSplitted[0];

  var numCharsTilNextWord = charsTilNextWord.length;

  return [numCharsTilNextWord, 0];
  //var nextWordIndex = firstPart.length + numCharsTilNextWord;

}

$(function() {
  var conf = newConfig();

  var cursor = newCursor();
  initCursor(cursor);

  addCmdMode();
  var inCmdMode = false;


  function toggleCmdMode() {
    inCmdMode = !inCmdMode;

    if (inCmdMode) {
      $('#cmd-mode').text(':');
      $('#cmd-mode').show();
    }
    else {
      $('#cmd-mode').hide();

    }

  }

  function keyFunc(e) {
    var key = e.which;
    var charKey = String.fromCharCode(key);

    var escKey = key == 27;

    if (escKey) { //(!inCmdMode && escKey)
      toggleCmdMode();
    }

    if (inCmdMode) {
      if (charKey == 'H')
        moveCursorPos(cursor, -1, 0);
      else if (charKey == 'L')
        moveCursorPos(cursor, 1, 0);
      else if (charKey == 'K')
        moveCursorPos(cursor, 0, -1);
      else if (charKey == 'J')
        moveCursorPos(cursor, 0, 1);
    }


    console.log(charKey);
  }

  //$('body').keyup(keyFunc);
  //$('.CodeMirror-code').keypress(keyFunc);
  $('.CodeMirror-code').keyup(keyFunc);
  $('.CodeMirror-code').keypress(function(e) {
    e.preventDefault();
  })
});





