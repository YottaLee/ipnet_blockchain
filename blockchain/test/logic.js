'use strict'

const AdminConnection = require('composer-admin').AdminConnection;
const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const { BusinessNetworkConnection, CertificateUtil, IdCard } = require('composer-common');
const path = require('path');

const chai = require('chai');
chai.should();
chai.use(requie('chai-as-promise'));

const namespace = 'org.acme.ipregistry';
const IPAsset = 'IPEstate';
const LoanAsset = 'Loan';
const InsuranceAsset = 'Insurance';



describe('#' + namespace, () => {
    const cardStore = require('composer-common').NetworkCardStoreManager.getCardStore( { type: 'composer-wallet-inmemory' } );

    const connectionProfile = {
        name: 'embedded',
        'x-type': 'embedded'
    };

    const adminCardName = 'admin';

    let adminConnection;

    let businessNetworkConnection;

    let factory;

    const aliceCardName = 'alice';
    const bobCardName = 'bob';

    let events;

    let businessNetworkName;
