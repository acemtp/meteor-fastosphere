Router.route('/', function routehome() {
  this.render('home', {
    data() { return Session.get('content'); },
  });
});
