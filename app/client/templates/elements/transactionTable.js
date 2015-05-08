/**
Template Controllers

@module Templates
*/


/**
The transaction row template

@class [template] elements_transactions_table
@constructor
*/

/**
Block required until a transaction is confirmed.

@property blocksForConfirmation
@type Number
*/
var blocksForConfirmation = 12;

/**
The default limit, of none is given.

@property defaultLimit
@type Number
*/
var defaultLimit = 20;

Template['elements_transactions_table'].onCreated(function(){
    this._properties = {
        cursor: {}
    };

    TemplateVar.set('limit', this.data.limit || defaultLimit);
});

Template['elements_transactions_table'].helpers({
    /**
    Changes the limit of the given cursor

    @method (items)
    @return {Object} The items cursor
    */
    'items': function(){
        var template = Template.instance(),
            items = [],
            searchQuery = TemplateVar.get('search'),
            limit = TemplateVar.get('limit'),
            selector = this.transactionIds ? {_id: {$in: this.transactionIds}} : {};

        // if search
        if(searchQuery) {
            var pattern = new RegExp('^.*'+ searchQuery.replace(/ +/g,'.*') +'.*$','i');
            template._properties.cursor = Transactions.find(selector, {sort: {blockNumber: -1}});
            items = template._properties.cursor.fetch();
            items = _.filter(items, function(item){
                // search from address
                if(pattern.test(item.from))
                    return item;

                // search to address
                if(pattern.test(item.to))
                    return item;

                // search value
                if(pattern.test(Helpers.formatBalance(item.value, '0,0.00[000000]')))
                    return item;

                // search date
                if(pattern.test(moment.unix(item.timestamp).format('LLLL')))
                    return item;

                return false;
            });
            items = items.slice(0, defaultLimit * 4);
            return items;

        } else {
            template._properties.cursor = Transactions.find(selector, {sort: {blockNumber: -1}, limit: limit});
            return template._properties.cursor.fetch();
        }
    },
    /**
    Check if there are more transactions to load. When searching don't show the show more button.

    @method (hasMore)
    @return {Boolean}
    */
    'hasMore': function(){
        var template = Template.instance();

        template._properties.cursor.limit = null;
        return (!TemplateVar.get('search') && template._properties.cursor.count() > TemplateVar.get('limit'));
    }
});

Template['elements_transactions_table'].events({
    'click button.show-more': function(e, template){
        var limit = TemplateVar.get('limit');
        TemplateVar.set('limit', limit + (template.data.limit || defaultLimit));
    },
    'keyup input.filter-transactions': _.debounce(function(e, template){
        if(e.keyCode === 27)
            e.currentTarget.value = '';

        TemplateVar.set(template, 'search', e.currentTarget.value);
    }, 200)
});




/**
The transaction row template

@class [template] elements_transactions_row
@constructor
*/


Template['elements_transactions_row'].helpers({
    /**
    Returns the confirmations

    @method (totalConfirmations)
    */
    'totalConfirmations': blocksForConfirmation,
    /**
    Checks whether the transaction is confirmed ot not.

    @method (unConfirmed)
    */
    'unConfirmed': function() {
        var currentBlockNumber = Blockchain.findOne().blockNumber,
            confirmations = currentBlockNumber - this.blockNumber + 1;
        return (this.blockNumber > currentBlockNumber - blocksForConfirmation && (currentBlockNumber - blocksForConfirmation) > 0)
            ? {
                confirmations: confirmations,
                percent: (confirmations / (blocksForConfirmation-1)) * 100
            }
            : false;
    },
    /**
    Gets the transactions account

    @method (account)
    */
    'account': function() {
        return Accounts.findOne(this.account);
    }
});