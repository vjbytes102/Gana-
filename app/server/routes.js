var AM = require('./modules/dbManager');

module.exports = function(app) {

    // main login page //
    app.get('/', function(req, res) {
        // check if the user's credentials are saved in a cookie //
        if (req.session.user == null) {
            // if user is not logged-in redirect back to login page //
            res.render('login', { title: 'Hello - Please Login To Your Account' });
        } else {
            res.redirect('/home');
        }
    });

    app.post('/', function(req, res) {
        AM.manualLogin(req.body['user'], req.body['pass']).then(function(result) {
            req.session.user = result;
            if (req.body['remember-me'] == 'true') {
                res.cookie('user', result.user, { maxAge: 900000 });
                res.cookie('pass', result.pass, { maxAge: 900000 });
            }
            console.log('login success');
            res.status(200).send(result);
        }).catch((err) => {
            console.log("error in index post method")
            res.status(500).send(err);
        });
    });

    // logged-in user homepage //
    app.get('/home', function(req, res) {
        if (req.session.user == null) {
            // if user is not logged-in redirect back to login page //
            res.redirect('/');
        } else {
            var userName = req.session && req.session.user && req.session.user.name;
            var finalObject = {};
            AM.getMostRecentPlayList().then(function(data) {
                var tkRes = JSON.stringify(data);
                var finaltkRes = JSON.parse(tkRes);
                finalObject.recentPlaylist = finaltkRes;
                return AM.searchRecentAlbum().then(function(plres) {
                    var AbRes = JSON.stringify(plres);
                    var finalAbRes = JSON.parse(AbRes);
                    finalObject.ABRecent = finalAbRes;
                    res.render('home', finalObject);
                });
            }).catch(err => {
                console.log("error in home get method")
                res.status(500).send(err);
            });
        }
    });
    //search page//
    app.get('/search', function(req, res) {
        if (req.session.user == null) {
            // if user is not logged-in redirect back to login page //
            res.redirect('/');
        } else {
            var userName = req.session && req.session.user && req.session.user.name;
            res.render('search');
        }
    });

    app.get('/search-query', function(req, res) {
        var url = require('url');
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        var key = query.key;
        var userName = req.session.user;
        var finalObject = {};
        if (userName[0] != null && userName[0].uid != null) {
            userName = userName[0].uid;
        }
        if (req.session.user == null) {
            res.redirect('/');
        } else {
            AM.searchKeyword(key, userName).then(function(data) {
                var str = JSON.stringify(data);
                var finalres = JSON.parse(str);
                finalObject.SongSearch = finalres;
                return AM.searchAlbumKeyword(key).then(function(result) {
                    var abRes = JSON.stringify(result);
                    var finalabRes = JSON.parse(abRes);
                    finalObject.AlbumSearch = finalabRes;
                    return AM.searchTrackKeyword(key).then(function(trackres) {
                        var tkRes = JSON.stringify(trackres);
                        var finaltkRes = JSON.parse(tkRes);
                        finalObject.TrackSearch = finaltkRes;
                        return AM.searchArtistKeyword(key).then(function(atres) {
                            var artistRes = JSON.stringify(atres);
                            var finalartistRes = JSON.parse(artistRes);
                            finalObject.ArtistSearch = finalartistRes;
                            return AM.searchPlayListKeyword(key).then(function(plres) {
                                var playListRes = JSON.stringify(plres);
                                var finalplayListRes = JSON.parse(playListRes);
                                finalObject.PlayListSearch = finalplayListRes;
                                res.send(finalObject);
                            });
                        });
                    });
                });
            }).catch(err => {
                console.log("error in search query post method")
                res.status(500).send(err);
            });
        }
    });

    //plays
    app.get('/plays', function(req, res) {
        var url = require('url');
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query;
        var key = query.key;
        var keyVal = query.val;
        var finalObject = {};
        if (req.session.user == null) {
            // if user is not logged-in redirect back to login page //
            res.redirect('/');
        } else {
            var userName = req.session && req.session.user && req.session.user.name;
            AM.searchPlays(key, keyVal).then(function(sres) {
                var searchRes = JSON.stringify(sres);
                var finalsRes = JSON.parse(searchRes);
                finalObject.SongSearch = finalsRes;
                if (key == 'pid') {
                    res.render('plays', { PlayList: finalObject.SongSearch });
                } else if (key == 'tid') {
                    res.render('plays', { TrackSearch: finalObject.SongSearch });
                } else if (key == 'abid') {
                    res.render('plays', { AlbumSearch: finalObject.SongSearch });
                } else if (key == 'aid') {
                    res.render('plays', { ArtistSearch: finalObject.SongSearch });
                } else if (key == 'pidc') {
                    res.render('plays', { PlayList: finalObject.SongSearch });
                } else {
                    res.render('plays', { SongSearch: finalObject.SongSearch });
                }
            }).catch(err => {
                console.log("error in plays get method")
                res.status(500).send(err);
            });
        }
    });

    //create playlist page//
    app.get('/addplaylist', function(req, res) {
        var finalObject = {};
        if (req.session.user == null) {
            // if user is not logged-in redirect back to login page //
            res.redirect('/');
        } else {
            var userName = req.session.user;
            var uid = '';
            if (userName[0] != null && userName[0].uid != null) {
                uid = userName[0].uid;
            }
            AM.getPlayListKeyword(uid).then(function(plres) {
                var searchRes = JSON.stringify(plres);
                var finalsRes = JSON.parse(searchRes);
                finalObject.SongSearch = finalsRes;
                res.render('addplaylist', { PlaylistSearch: finalObject.SongSearch });
            }).then(err => {
                res.status(500).send(err);
            });
        }
    });

    app.get('/createplaylist', function(req, res) {
        if (req.session.user == null) {
            // if user is not logged-in redirect back to login page //
            res.redirect('/');
        } else {
            var userName = req.session && req.session.user && req.session.user.name;
            res.render('createplaylist');
        }
    });

    app.post('/createplaylist', function(req, res) {
        var userName = req.session.user;
        var uid = '';
        if (userName[0] != null && userName[0].uid != null) {
            uid = userName[0].uid;
        }
        var name = req.body.key;
        var type = req.body.type;
        AM.addNewPlaylist(uid, name, type).then(function() {
            res.status(200).send('ok');
        }).then(err => {
            res.status(500).send(err);
        });
    });

    app.post('/logout', function(req, res) {
        res.clearCookie('user');
        res.clearCookie('pass');
        req.session.destroy(function(e) { res.status(200).send('ok'); });
    })

    // creating new accounts //

    app.get('/signup', function(req, res) {
        res.render('signup', { title: 'Signup' });
    });

    app.post('/signup', function(req, res) {
        AM.addNewAccount({
            name: req.body['name'],
            user: req.body['user'],
            pass: req.body['pass'],
            city: req.body['city'],
            email: req.body['email'],
        }).then(function() {
            res.status(200).send('ok');
        }).catch(err => {
            console.log("error in signup post method")
            res.status(500).send(err);
        });
    });

    app.post('/rating', function(req, res){
        var uid = req.session.user && req.session.user[0].uid;
        var sid = req.body.sid;
        var rating = req.body.rating;
        if(uid && sid && rating){
            AM.addRating(uid, sid, rating).then(()=>{
                res.status(200).send("success");
            }).catch(err=>{
                console.log("error in add rating post method");
                res.status(500).send(err);
            })
        } else {
            console.log("error in post rating method incomplete fields");
            res.status(400).send('sid or rating not found');
        }
    });

    app.post('/like-artist', function(req, res){
        var uid = req.session.user && req.session.user[0].uid;
        var aid = req.body.aid;
        if(uid && aid){
            AM.addArtistLikes(uid, aid).then(()=>{
                res.status(200).send("success");
            }).catch(err=>{
                console.log("error in add artist like post method");
                res.status(500).send(err);
            })
        } else {
            console.log("error in post artist like method incomplete fields");
            res.status(400).send('sid or rating not found');
        }
    });

    app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found' }); });

};