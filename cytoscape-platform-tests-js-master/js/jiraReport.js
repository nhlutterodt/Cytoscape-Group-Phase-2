

class AP {
  constructor (base_url, port) {
    if (base_url === undefined) {
      base_url = CyRESTInstance.BASE_URL
    }
    if (port === undefined) {
      port = CyRESTInstance.PORT
    }
    this.port = port
    this.base_url = base_url
  }
}

//jiraRESTInstance.PORT = 8080
jiraRESTInstance.BASE_URL = 'https://cytoscape.atlassian.net/'

class JiraCaller {
  // ''
  // 'Basic functions for calling JIRA REST'
  // ''
  constructor (jira_rest_instance) {
    // ''
    // 'Constructor remembers JiraREST location and  credentials'
    // ''
    if (jira_rest_instance === undefined) {
      jira_rest_instance = new jiraRESTInstance()
    }
    this.jira_rest_instance = jira_rest_instance
    this.log = undefined
  }

  setLogCallBack (callback) {
    this.log = callback
  }

  //this is currently using a basic authorization method for testing
  request (method, url, data, callback) {
    const Http = new XMLHttpRequest()
    Http.open(method, url)
    Http.setRequestHeader('Content-type', 'application/json')
    Http.setRequestHeader('Accept', 'application/json')
    Http.setRequestHeader('authorization','<token>')
    Http.send(data)
    Http.onreadystatechange = (e) => {
      if (Http.readyState === 4) {        
				const resp = Http.responseText
				if (this.log){
					this.log(resp.substr(0, 300) + '...', 'response')
				}
        callback(resp)
      }
    }
  }

  _execute (http_method, endpoint, data, callback) {
    // ''
    // 'Set up a REST call then return result'
    // ''
    const hasData = (data instanceof Array && data.length > 0) || (data instanceof Object && Object.keys(data).length !== 0)
    var url = this.jira_rest_instance.base_url + endpoint
    if (this.log) {
      this.log(http_method.toUpperCase() + ' ' + url, 'call')
      if (hasData) {
        this.log('data=' + JSON.stringify(data), 'call')
      }
    }

    if (hasData) {
      data = JSON.stringify(data)
    } else {
      data = null
    }

    this.request(http_method,
      url,
      data,
      callback)
  }

  post (endpoint, data, callback = console.log) {
    // ''
    // 'Execute a REST call using POST'
    // ''
    return this._execute('post', endpoint, data, callback)
  }

  
  /* this would be used to change data. 
  put (endpoint, data, callback = console.log) {
    // ''
    // 'Execute a REST call using PUT'
    // ''
    return this._execute('put', endpoint, data, callback)
  }
  */
  get (endpoint, callback = console.log) {
    // ''
    // 'Execute a REST call using GET'
    // ''
    return this._execute('get', endpoint, {}, callback)
  }
}