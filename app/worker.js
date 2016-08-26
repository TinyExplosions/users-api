// Using webworker to do some heavier processing tasks away from the main thread.
var remoteUsers;
var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Listen to main thread calling the webworker, and respond accordingly
self.addEventListener('message', function(e) {
    var data = e.data;
    switch (data.cmd) {
        case 'load':
            self.userDetailFrag(data.id);
            break;
        case 'list':
            self.getUsers();
            break;
        case 'search':
            self.findUsers(data.term);
            break;
        default:
            self.postMessage('Unknown command: ' + data.msg);
    };
}, false);

// Does remote request to get user list, or individual user if `id` is set
function getUsers(id) {
    xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            var users = JSON.parse(xmlhttp.responseText);
            // if multiple users returned, sort them and create HTML
            if (users.length > 0) {
                users = users.sort(sortUsers);
                var userList = '';
                remoteUsers = users;
                for (var i = 0; i < users.length; i++) {
                    userList += TemplateEngine(listTemplate, users[i]);
                }
                postMessage(TemplateEngine(listView, { userlist: userList }));
            } else {
              // Only single user returned, show detail view
                var dob = new Date(users.dob);
                users.birthday = dob.getDate() + ' ' + months[dob.getMonth()] + ', ' + dob.getFullYear();
                postMessage(TemplateEngine(userTemplate, users));
            }
        }
    };
    var path = "/users";
    if (id) {
        path += "/" + id;
    }
    xmlhttp.open("GET", path, true);
    xmlhttp.send();
}

// Get the id's of any matching users first or last names
function findUsers(term) {
  if(!term) {
    // no term passed, so return all
    searchResults = remoteUsers;
  } else {
    // clearing 'special' regex chars, and setting case insensitive
    var searchExp = new RegExp(term.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");
    var searchResults = remoteUsers.filter(function(user){
      return searchExp.test(user.name.last) || searchExp.test(user.name.first);
    });
  }
  // create array of user ID's to return
  var userList = [];
  if(searchResults.length > 0) {
    var users = searchResults.sort(sortUsers);
    for (var i = 0; i < users.length; i++) {
        userList.push(users[i]._id);
    }
  }
  // send matching user ID's back to main thread.
  postMessage({ type: 'result', foundUsers: userList});
}

// simple sort on last name, then first name
function sortUsers(a, b) {
    var f1 = a.name.first.toLowerCase();
    var f2 = b.name.first.toLowerCase();

    var l1 = a.name.last.toLowerCase();
    var l2 = b.name.last.toLowerCase();

    if (l1 < l2) return -1;
    if (l1 > l2) return 1;
    if (f1 < f2) return -1;
    if (f1 > f2) return 1;
    return 0;
}

// This will find a User with specified id, and return detail view
function userDetailFrag(id) {
    function findUser(user) {
        return user._id === id;
    }
    if (remoteUsers) {
        var user = remoteUsers.find(findUser);
        var dob = new Date(user.dob);
        user.birthday = dob.getDate() + ' ' + months[dob.getMonth()] + ', ' + dob.getFullYear();
        postMessage(TemplateEngine(userTemplate, user));
    } else {
        getUsers(id);
    }
}

// 'chrome' around the User list
var listView = '<header class="header"><input type="text" class="search" placeholder="Search..."/><button class="refresh"></button></header><ul><%userlist%></ul>';

// Template for the individual list view of a User
var listTemplate = '<li data-id="<%_id%>">' +
    '<img src="<%picture.thumbnail%>"><h6><%name.first%> <%name.last%></h6>' +
    '<p><%email%><br/><%cell%></p>' +
    '</li>';

// Template for our 'detail' view of a user
var userTemplate = '<header class="large-header"><img src="<%picture.large%>"><h1><%name.title%> <%name.first%> <%name.last%></h1><h6><%username%></h6><button class="close"></button></header>' +
    '<div class="details">' +
    '<a class="phone" href="tel:<%phone%>"><img class="icon" src="icons/phone.svg"><p><%phone%></p><small>Phone</small></a>' +
    '<a class="phone" href="tel:<%cell%>"><img class="icon" src="icons/cell.svg"><p><%cell%></p><small>Cell</small></a>' +
    '<a class="email" href="mailto:<%email%>"><img class="icon" src="icons/email.svg"><p><%email%></p><small>Email</small></a>' +
    '<div class="address"><img class="icon" src="icons/home.svg"><p><%location.street%><br /><%location.city%><br/><%location.state%></p><small>Address</small></div>' +
    '<div class="birthday"><img class="icon" src="icons/birthday.svg"><p id="birthday"><%birthday%></p><small>Birthday</small></div>' +
    '<div class="pps"><img class="icon" src="icons/pps.svg"><p><%PPS%></p><small>PPS#</small></div>' +
    '</div>';


// Super simple template engine, from http://krasimirtsonev.com/blog/article/Javascript-template-engine-in-just-20-line
var TemplateEngine = function TemplateEngine(html, options) {
    var re = /<%(.+?)%>/g,
        reExp = /(^( )?(var|if|for|else|switch|case|break|{|}|;))(.*)?/g,
        code = 'with(obj) { var r=[];\n',
        cursor = 0,
        result;
    var add = function(line, js) {
        js ? (code += line.match(reExp) ? line + '\n' : 'r.push(' + line + ');\n') :
            (code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        return add;
    }
    while (match = re.exec(html)) {
        add(html.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(html.substr(cursor, html.length - cursor));
    code = (code + 'return r.join(""); }').replace(/[\r\t\n]/g, ' ');
    try { result = new Function('obj', code).apply(options, [options]); } catch (err) { console.error("'" + err.message + "'", " in \n\nCode:\n", code, "\n"); }
    return result;
}
