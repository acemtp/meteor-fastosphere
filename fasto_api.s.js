Router.route('/api/changelog', { where: 'server' })
  .post(function () {
    // POST /webhooks/stripe
    console.log(this.request.body.packages)
    console.log(this.request.body.versions)

    this.response.end('POST Here is the changelog\n');
  });
