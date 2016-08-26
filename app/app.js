var _ignoreHashChange = false;
var myWorker = new Worker('worker.js');

if (window.location.hash) {
    myWorker.postMessage({
        'cmd': 'load',
        'id': window.location.hash.replace('#', '')
    });
} else {
    myWorker.postMessage({
        'cmd': 'list'
    });
}

myWorker.onmessage = function(event) {
    if (event.data.attr) {
        document.querySelector(event.data.attr).innerHTML = event.data.html;
    } else if (event.data.type) {
        if (event.data.type === "result") {
            var items = document.querySelectorAll('li');
            for (var i = 0; i < items.length; i++) {
                var display = '';
                if (event.data.foundUsers.indexOf(items[i].dataset.id) === -1) {
                    display = 'none'
                }
                items[i].style.display = display;
            }
        }
    } else {
        document.querySelector('body').innerHTML = event.data;
        if (document.querySelector('.details')) {
            document.querySelector('.close').addEventListener('click', function(evt) {
                return myWorker.postMessage({
                    'cmd': 'list'
                });
            });
        } else {
            _ignoreHashChange = true;
            window.location.hash = '';
            document.querySelectorAll('ul')[0].style.opacity = 1;
            var items = document.querySelectorAll('li');
            for (var i = 0; i < items.length; i++) {
                items[i].addEventListener('click', function(evt) {
                    var item = evt.currentTarget;


                    console.log("load!");
                    window.location.hash = item.dataset.id;
                    _ignoreHashChange = false;
                    return myWorker.postMessage({
                        'cmd': 'load',
                        'id': item.dataset.id
                    });
                });
            }
            document.querySelector('.search').addEventListener('keyup', function(evt) {
                return myWorker.postMessage({
                    'cmd': 'search',
                    'term': this.value
                });
            });
            document.querySelector('.refresh').addEventListener('click', function(evt) {
                document.querySelectorAll('ul')[0].style.opacity = 0.3;
                return myWorker.postMessage({
                    'cmd': 'list'
                });
            });
        }
    }
};

window.onhashchange = function() {
    if (_ignoreHashChange) {
        return;
    }
    console.log('onhashchange');
    if (window.location.hash === "") {
        return myWorker.postMessage({
            'cmd': 'list'
        });
    }

}
