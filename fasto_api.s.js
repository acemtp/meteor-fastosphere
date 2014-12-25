Router.route('/api/changelog', { where: 'server' })
  .post(function () {
    // POST /webhooks/stripe
    console.log('POST THIS IS NEW', this);
    console.log('P', this.params);
    this.response.end('POST Here is the changelog\n');
  });
