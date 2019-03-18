window.DATA = { 'log': [], 'responses': {} }

const GALFILTERED = 'https://raw.githubusercontent.com/cytoscape/cytoscape-platform-tests-js/master/networks/galFiltered.cx'

function toggleLog () {
  const log = document.getElementById('log-container')
  log.style.display = log.style.display === 'none' ? 'block' : 'none'
}
 

function init (slide) {
 // console.log('init func called for slide:'+ slide.id)
  addResponse(slide.id, { 'appVersion': window.navigator['appVersion'] })
  showControls(slide)
}

/* SLIDES */
function close_session (slide) {
 // console.log('close_session func called for slide:'+ slide.id)
  cyCaller.delete('/v1/session', {}, function (r) {
    showControls(slide)
  })
}

function galfiltered (slide) {
  const url = GALFILTERED
  cyCaller.load_file_from_url(url, function (suid) {
    log('Loaded galfiltered with SUID ' + suid, slide.id)
    cyCaller.get('/v1/networks/' + suid + '/edges', function (edges) {
      edges = JSON.parse(edges)
      log('Edges in galfiltered = ' + edges.length, slide.id)
      addResponse(slide.id)

      const check = slide.getElementsByClassName('edgeCountMatches')[0]
      check.labels[0].innerText = 'Edge count is ' + edges.length + '?'
      cyCaller.get('/v1/networks/' + suid + '/nodes', function (nodes) {
        nodes = JSON.parse(nodes)
        log('Nodes in galfiltered = ' + nodes.length, slide.id)
        addResponse(slide.id, {
          'cyrestNodeCount': nodes.length,
          'cyrestEdgeCount': edges.length
        })

        const check = slide.getElementsByClassName('nodeCountMatches')[0]
        check.labels[0].innerText = 'Node count is ' + nodes.length + '?'
        showControls(slide)
      })
    })
  })
}


function diffusion (slide) {

 // pull selected test from Test selection 
  var selectedTest = window.DATA.responses['diffusionTestConfig'];
  var endpoint = '';
  var data = {};
  var option = ' '; 

  // setup test endpoint and test Type
  if (selectedTest.diffusionTest === true){
    endpoint = '/diffusion/v1/currentView/diffuse';
      
  }else if (selectedTest.diffusionTestwithoptions === true){
     endpoint = '/diffusion/v1/currentView/diffuse_with_options';
     option = ' with options ';
     data = {"Time":selectedTest.diffusionwithoptions_time, "heatColumnName": selectedTest.diffusionwithoptions_heatcolumn};
     //{"Time": "0.1", "heatColumnName": "gal80Rexp"}
  }

    // Update the label based on the selected test
    const check = slide.getElementsByClassName('diffused')[0]
        check.labels[0].innerText = 'Did diffusion'+option+'run successfully and select nodes?'

    const select_nodes = (suid, node_suids) => {
      cyCaller.put('/v1/networks/' + suid + '/nodes/selected', node_suids, function () {
        cyCaller.post(endpoint, data, () => {
          showControls(slide)
        })
      })
    }
 
  const url = GALFILTERED
  cyCaller.load_file_from_url(url, function (suid) {
    cyCaller.get('/v1/networks/' + suid + '/tables/defaultnode/rows', function (r) {
      const rows = JSON.parse(r)
      for (var i in rows) {
        if (rows[i]['COMMON'] === 'RAP1') {
          select_nodes(suid, [rows[i]['SUID']])
          return
        }
      }
    })
  })
}

function layout (slide) {

  // pull selected test from Test selection 
  var selectedTest = window.DATA.responses['layoutTestConfig'];
  var endpoint = '';
  var data = {};
  var layoutType = '';

  // setup test endpoint and test Type
  if (selectedTest.circularLayout === true){
    endpoint = '/v1/apply/layouts/circular/';
    layoutType = 'circular';
      
  }else if (selectedTest.hierarchalLayout === true){
     endpoint = '/v1/apply/layouts/hierarchical/';
      layoutType = 'hierarchical';
  }

  // Update the label based on the selected test
 const check = slide.getElementsByClassName('layoutType')[0]
        check.labels[0].innerText = 'Has the ' + layoutType + ' layout been applied?'

  const url = GALFILTERED
  cyCaller.load_file_from_url(url, function (suid) {
    cyCaller.get(endpoint + suid,
      function () {
        showControls(slide)
      })
  })
}

function session_save (slide) {
  const post_save = (loc) => {
    initDropArea(slide, "cysDrop", 'Saved session file to ' + loc + '.cys', '.cys', handleCYS)
		showControls(slide)
	}
	const url = GALFILTERED
  cyCaller.load_file_from_url(url, function (suid) {
    cyCaller.get('/v1/session?file=//', (loc) => {
      loc = JSON.parse(loc)
			if (loc.hasOwnProperty('errors')){
        path = loc['errors'][0]['link']
        window.logFilePath = path
				loc = path.substr(5, path.lastIndexOf('.')-5)
    		cyCaller.post('/v1/session?file=' + loc, {}, (loc2) => {
					loc2 = JSON.parse(loc2)['file']
					post_save(loc2)
				})
			}
		})
  })
}

function toggle_tests(vis){
  const testDiv = document.getElementById('tests')
  const revealContainer = document.getElementById('reveal-container')

  if (vis){
    testDiv.style.position = 'absolute'
    testDiv.style.zIndex = 200
    testDiv.style.bottom = 0
    testDiv.style.height = '50%'
    revealContainer.style.height = '50%'
  }else{
    revealContainer.style.height = '100%'
    testDiv.style.height = '0%'
  }
}

function runjasmine (slide) {
  log(JSON.stringify(window.DATA['responses']), slide.id)
  window.runtests()
}

function feedback(slide){
  setTimeout(() => { showControls(slide) }, 500 )
}

function close_cytoscape_slide(slide){
  setTimeout(() => { showControls(slide) }, 500)
  let text = "Default location is in your Home Directory, at <br/>~/CytoscapeConfiguration/3/framework.log"
  if (window.logFilePath){
    text = "Load log file from " + window.logFilePath
  }
  initDropArea(slide, "logDrop", text, '.log', handleLog)
}

function submit_slide(slide){
  showControls(slide)
  var element = document.createElement('p')
  text = window.DATA.log.join('\n')
  
  element.style = 'font-size: 22px'
  element.innerHTML = '<a href="data:text/plain;charset=utf-8,' +
    encodeURIComponent(text) + '" download="Cytoscape_Testing_results.txt">Download testing results</a>' +
    '<br/> or <br/>' +
    '<button onclick="submit_jira_ticket()">Submit them as a JIRA Issue Here</button>' 
   

  slide.appendChild(element)
}

/* File drop area */
function handleCYS(files) {
  addResponse('session_save', { 'file_size': files[0].size })
}


function handleLog(files) {
  const reader = new FileReader()
  reader.onload = (f) => {
    window.DATA.log.push('--- Cytoscape Log ---')
    window.DATA.log.push(reader.result)
  }
  reader.readAsText(files[0], 'utf-8')
}

function initDropArea(slide, id, text, ext, callback) {
  const dropArea = document.createElement('div')
  dropArea.id = 'drop-area'
  dropArea.className = 'drop-session'
  const dropForm = document.createElement('form')
  dropForm.className = 'drop-form'
  // dropArea.style.visibility = 'hidden'
  const note = document.createElement('p')
  note.innerHTML = text
  const fileBtn = document.createElement('input')
  fileBtn.type = 'file'
  fileBtn.className = 'fileBtn'
  fileBtn.id = id
  fileBtn.name = id
  fileBtn.accept = ext
  fileBtn.onchange = (f) => {
    dropArea.style.backgroundColor = '#669166'
    window.f = f; callback(f.target.files)
  }
  const label = document.createElement('label')
  label.className = 'button'
  label.htmlFor = id
  label.innerText = "Select " + ext + " file"
  
  dropForm.appendChild(note)
  dropForm.appendChild(fileBtn)
  dropForm.appendChild(label)
  dropArea.appendChild(dropForm)
  slide.appendChild(dropArea)
  
  ;['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
  })

  function preventDefaults(e) {
    e.preventDefault()
    e.stopPropagation()
  }
  ;['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
  })

  ;['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
  })

  function highlight(e) {
    dropArea.classList.add('highlight')
  }

  function unhighlight(e) {
    dropArea.classList.remove('highlight')
  }
  dropArea.addEventListener('drop', handleDrop, false)


  function handleDrop(e) {
    let dt = e.dataTransfer
    let files = dt.files
    if (files.length < 1 || !files[0].name.endsWith(ext)){
      alert("Only " + ext + " files are supported")
      return
    }
    dropArea.style.backgroundColor = '#669166'
    callback(files)
  }

  return dropArea
}

/* HELPERS */
function showResultSubmit(text){
  const form = Reveal.getCurrentSlide().getElementsByTagName('form')[0]
  var element = document.createElement('p')
  if (text === null){
    text = '--- REVEAL.JS ---\n' + window.DATA.log.join('\n')
  }
  element.style = 'font-size: 22px'
  element.innerHTML = '<a href="data:text/plain;charset=utf-8,' +
    encodeURIComponent(text) + '" download="Cytoscape_Testing_results.txt">Download testing results</a>' +
    '<br/> and <br/>' +
    '<a href="https://docs.google.com/forms/d/e/1FAIpQLSd6mqK5yYd7ziRNqL37B5rxf-gI2z2_9oahjvcf-OXBUqOPGQ/viewform">submit them here</a>' +
    ' or ' +
    '<a target="_blank" href="mailto:bsettle@ucsd.edu">email them to bsettle@ucsd.edu</a></p>'
  form.remove()

  window.close_cytoscape.appendChild(element)
}

function addResponse (name, data) {
  if (!window.DATA.responses.hasOwnProperty(name)) {
    window.DATA.responses[name] = {}
  }
  window.res = Object.assign(window.DATA.responses[name], data)
}

function log (message, context = 'info') {
  const line = context + ' :: ' + message
  window.DATA['log'].push(line)
  const log = document.getElementById('log')
  log.innerHTML = window.DATA['log'].join('\n')
  log.scrollTop = log.scrollHeight
}

function buildInput (n) {
  let entry = ''
  if (n['type'] === 'checkbox') {
    entry = "<input type='checkbox' id='" + n['id'] + "' class='" + n['id'] + "'/>" +
      "<label for='" + n['id'] + "'>" + n['text'] + '</label>'
  }
  else if (n['type'] === 'radio') {
    entry = "<input type='radio'" + (n['checked'] === "true" ? 'checked': '') + " name='" + n['name'] + "' id='" + n['id'] + "' class='" + n['id'] + "'/>" +
      "<label for='" + n['id'] + "'>" + n['text'] + '</label>'
  }  
  else if (n['type'] === 'text') {
    entry = "<label for='" + n['id'] + "'>" + n['text'] + '</label>' +
      "<input type='text' id='" + n['id'] + "'' name='" + n['id'] + "'/>"
  } else if (n['type'] === 'textarea') {
    entry = "<label for='" + n['id'] + "'>" + n['text'] + '</label>' +
      "<textarea id='" + n['id'] + "'' name='" + n['id'] + "'></textarea>"
  } else {
    entry = "<input type='" + n['type'] + "' id='" + n['id'] + "' class='" + n['id'] + "'/>"
  }
  return "<div class='entry'>" + entry + '</div>'
}

function buildSlide (options, container) {
  var slide = '<h3>' + options.title + '</h3>'
  if (options.text) {
    slide += "<p class='text'>" + options.text + '</p>'
  }
  slide += '<div class="preload" id="preload" style="display: block;">Preparing test<br>' + 
  '<img src="images/preload.svg" style="border-width:0px;  background: none;"></img>' +
  '<p style="font-size: 12px">If it takes too long, hit continue</p></div>'
  slide += '<div class="entries" id="entries" style="display: none;">'
  if (options.inputs) {
    for (var n in options.inputs) {
      slide += buildInput(options.inputs[n])
    }
  }
  slide += '</div>'
  container.innerHTML = slide
}

function clearSession (slide, callback) {

  console.log ('clearSession called by slide' + slide + ' callback is ' + callback)
  cyCaller.delete('/v1/session', {}, function (r) {
    callback(slide)
  })
}

function call (slide) {

  console.log('call function called for slide:' + slide.id)
  toggle_tests(slide.id === 'runjasmine')
  const funcs = {
    'init': init,
    'close_session': (v) => { clearSession(v, showControls) },
    'galfiltered': (v) => { clearSession(v, galfiltered) },
    'diffusion': (v) => { clearSession(v, diffusion) },
    'layout': (v) => { clearSession(v, layout) },
    'hierarchalLayout': (v) => { clearSession(v, hierarchalLayout) },
    'session_save': (v) => { clearSession(v, session_save) },
    'runjasmine': runjasmine,
    'user_feedback': feedback,
    'close_cytoscape': close_cytoscape_slide,
    'submit': submit_slide
  }

  log('Starting slide: ' + slide.id, slide.id)
  if (funcs.hasOwnProperty(slide.id)) {
    Reveal.configure({ 
      controls: true,
     slideNumber: true 
  })
    try{
      funcs[slide.id](slide)
      setTimeout(() => { Reveal.configure({ controls: true }) }, 10000)
    } catch(e){
      console.log(e)
    }    
  } else {
    showControls(slide)
  }
}

function save_answers (slide) {
  if (!slide) {
    return
  }
  const inputs = slide.getElementsByTagName('input')
  for (let i = 0; i < inputs.length; i++) {
    const inp = inputs[i]
    if (inp.type === 'file') {
      continue
    }
    const id = slide.id
    const value = {
      'radio':inp.checked,
      'checkbox': inp.checked,
      'text': inp.value
    }[inp.type]
    const obj = { [inp.id]: value }
    addResponse(id, obj)
  }
}

function showControls (slide, vis = true) {
  console.log('showcontrols for slide ' + slide + ' value is '+ vis)
  var preloaddisplay = vis ? "none" : "block";
  var entriesdisplay = vis ? "block" : "none";
	if (slide.getElementsByClassName("preload").length > 0) {
		slide.getElementsByClassName("preload")[0].style.display = preloaddisplay;
	}
	if (slide.getElementsByClassName("entries").length > 0) {
		slide.getElementsByClassName("entries")[0].style.display = entriesdisplay;
	}
	if (slide.id === 'runjasmine'){
		addResponse(slide.id, {'results': window.tests.innerText})
	}
	Reveal.configure({ controls: vis })
}

Reveal.initialize({
  dependencies: [
    { src: 'plugin/anything/anything.js' },
    { src: 'plugin/markdown/marked.js' },
    { src: 'plugin/markdown/markdown.js' },
    { src: 'plugin/notes/notes.js', async: true },
    { src: 'plugin/highlight/highlight.js', async: true, callback: function () { hljs.initHighlightingOnLoad(); } }
  ],
  anything: [{
    className: 'cyrest',
    defaults: { 'title': 'Cytoscape Testing2' },
    initialize: function (container, options) {
      if (!options) {
        options = {}
      }
      buildSlide(options, container)
    }
  }],
  controlsBackArrows: 'hidden',
  controlsTutorial: false,
  progress: false,
  keyboard: false,
  overview: false
})

Reveal.addEventListener('slidechanged', function (event) {
  // event.previousSlide, event.currentSlide, event.indexh, event.indexv
  save_answers(event.previousSlide)
  call(event.currentSlide)
})




const cyCaller = new CyCaller()
cyCaller.setLogCallBack(log)
setTimeout(() => { call(Reveal.getSlide(0)) }, 500)
//log('Started Cytoscape Testing', 'init')

function submit_jira_ticket(){
    var data = JSON.stringify({
  "fields": {
    "summary": "Auto-generated report",
    "project": {
      "id": "10101"
    },
    "issuetype": {
      "id": "10100"
    }
  }
});

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;

xhr.addEventListener("readystatechange", function () {
  if (this.readyState === this.DONE) {
    console.log(this.responseText);
  }
});

xhr.open("POST", "https://cytoscape.atlassian.net/rest/api/3/issue");
xhr.setRequestHeader("authorization", "Basic bmhsdXR0ZXJvZHRAZ21haWwuY29tOjFaWlFRMFBkQ3JWdE9hMXNkb3JOMDIxMw==");
xhr.setRequestHeader("content-type", "application/json");

xhr.send(data);
}
