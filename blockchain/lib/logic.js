'use strict';

/**
 * Adding Ip 添加IP
 * @param {org.acme.ipregistry.AddAssetIP} iptrans
 * @transaction
 */

function addAssetIP(iptrans){
  var newip = iptrans.ip
  return getAssetRegistry("org.acme.ipregistry.IPEstate")
        .then(assetRegistry => {
            return assetRegistry.add(newip)
          })
}



/**
 * Adding Loan 添加Loan
 * @param {org.acme.ipregistry.AddAssetLoan} loantrans
 * @transaction
 */

function addAssetLoan(loantrans){
  var newloan = loantrans.loan
  return getAssetRegistry("org.acme.ipregistry.Loan")
        .then(assetRegistry => {
            return assetRegistry.add(newloan)
          })
}


/**
 * Adding Loan 添加Loan
 * @param {org.acme.ipregistry.AddAssetInsurance} insurancetrans
 * @transaction
 */

function addAssetInsurance(insurancetrans){
  var newinsurance = insurancetrans.insurance
  return getAssetRegistry("org.acme.ipregistry.Insurance")
        .then(assetRegistry => {
            return assetRegistry.add(newinsurance)
          })
}


/**
 * Adding IPPool 添加IPPool
 * @param {org.acme.ipregistry.AddAssetIPPool} pooltrans
 * @transaction
 */
// 专利池

function AddAssetIPPool(pooltrans){
  var newpool = pooltrans.ippool
  return getAssetRegistry("org.acme.ipregistry.IPPool")
        .then(assetRegistry => {
            return assetRegistry.add(newpool)
          })
}

/**
 * Adding Ip agent  给IP添加IPAgent
 * @param {org.acme.ipregistry.AddIPEstateAgent} addagent
 * @transaction
 */

function addIPEStateAgent(addagent){
  var ip = getIPByID(addagent.ipID)
  ip.agentID = addagent.agentID
  if(addagent.poolID != null){
    var pool = getIPPoolByID(addagent.poolID)
    ip.poolID = addagent.poolID
    index = pool.size()
    pool[index] = addagent.ipID
    
  }
  Promise.all([
    getAssetRegistry('org.acme.ipregistry.IPEstate'),
    getAssetRegistry('org.acme.ipregistry.IPPool')
  ]).then(function(registries){
    return (
      registries[0].update(ip),
      registries[1].update(pool)
    )
  })

} 

 /**
 * inpool
 * @param {org.acme.ipregistry.Inpool} inpool
 * @transaction
 */
function inPool(inpool){
  var pool = getIPPoolByID(inpool.poolID)
  var ip = getIPByID(inpool.ipID)
  var list = pool.ipID
  if(! list.contains(inpool.ipID)){
    list.append(inpool.ipID)
  }
  pool.ipID = list

  Promise.all([
    getAssetRegistry('org.acme.ipregistry.IPPool')
  ]).then(function(registries){
    return (
      registries[0].update(pool)
    )
  })
}

/**
 * outpool
 * @param {org.acme.ipregistry.Outpool} outpool
 * 退池直接删数组就行了吗？有其他要求吗。。。
 * @transaction
 */
function outPool(outpool){
  var pool = getIPPoolByID(inpool.poolID)
  var ip = getIPByID(inpool.ipID)
  var list = pool.ipID
  if(list.contains(inpool.ipID)){
    list.remove(inpool.ipID)
  }
  pool.ipID = list
  
  Promise.all([
    getAssetRegistry('org.acme.ipregistry.IPPool')
  ]).then(function(registries){
    return (
      registries[0].update(pool)
    )
  })
}





/**
 * Buying Ip Estate
 * @param {org.acme.ipregistry.BuyingIPEstate} trade
 * @transaction
 */

function buyingIPEstate( trade ){
  if(trade.agentRatio + trade.ownerRatio >1.0){
    throw new Error('ratio has error !')
  }
  var agentFees = trade.price * trade.agentRatio
  var ownerFees = trade.price * trade.ownerRatio
  var shareFees = trade.price - agentFees - ownerFees

  var buyer = getPrivateIndividualByID(trade.buyerID)
  var seller = getPrivateIndividualByID(trade.sellerID)
  var agent = getIPEstateAgentByID(trade.agentID)
  var ip = getIPByID(trade.ipID)
  var pool = getIPPoolByID(trade.poolID)

  if(buyer.balance < trade.price ){
    throw new Error('Not enough money to buy this!')
  }
  // Updates the seller's balance
  seller.balance += ownerFees
  buyer.balance -= trade.price
  agent.balance += agentFees

  size = pool.ipID.size()

  for (var i =0;i< pool.ipID.length;i++){
    var ipowner = getPrivateIndividualByID(pool.ipID[i])
    ipowner.balance += (shareFees/size())
  }


  Promise.all([
    getAssetRegistry('org.acme.ipregistry.IPEstate'),
    getParticipantRegistry('org.acme.ipregistry.PrivateIndividual'),
    getParticipantRegistry('org.acme.ipregistry.PrivateIndividual'),
    getParticipantRegistry('org.acme.ipregistry.IPEstateAgent'),
    getParticipantRegistry('org.acme.ipregistry.IPPool')
  ]).then(function(registries){
    return (
      registries[0].update(ip),
      registries[1].update(seller),
      registries[2].update(buyer),
      registries[3].update(agent),
      registries[4].update(pool)
    )
  })
}

/**
 * Defray for the evaluation report
 * @param {org.acme.ipregistry.BuyEvaluationReport} report
 * @transaction
 */

function buyEvaluationReport(report){
  
  var holder = getPrivateIndividualByID(report.holderID)
  var notary = getNotaryByID(report.notaryID)
  var payment = report.price

  if( holder.balance < payment ){
    throw new Error('Not enough funds to pay this!')
  }
  holder.balance -= payment
  notary.balance += payment
  Promise.all([
    getParticipantRegistry('org.acme.ipregistry.PrivateIndividual'),
    getParticipantRegistry('org.acme.ipregistry.Notary')
  ]).then(function(registries){
    return (
      registries[0].update(holder),
      registries[1].update(notary)
    )
  })
}




/**
 * Contracting an insurance
 * @param {org.acme.ipregistry.ContractingInsurance} insurance
 * @transaction
 */

 function contractingInsurance( insurance ){
    return getAssetRegistry('org.acme.ipregistry.Insurance')
      .then(function(assetRegistry){
      var factory = getFactory()
      var insuranceId = insurance.notary.id + ' '+ insurance.insured.id + '' + insurance.insuranceCompany.id + '' + insurance.ipEstate.id
      var insuranceAsset = factory.newResource('org.acme.ipregistry', 'Insurance', insuranceId)
      insuranceAsset.loan = insurance.loan
      insuranceAsset.insured = insurance.insured
      insuranceAsset.insuranceCompany = insurance.insuranceCompany
      insuranceAsset.ipEstate = insurance.ipEstate
      insuranceAsset.durationInMonths = insurance.durationInMonths
      insuranceAsset.monthlyCost = insurance.monthlyCost

      return assetRegistry.add(insuranceAsset)
    })
 }


 /**
 * Compensating an insurance
 * @param {org.acme.ipregistry.CompensatingInsurance} compensatinginsurance
 * @transaction
 */

 function compensatingInsurance( compensatinginsurance ){
  var insurance = compensatinginsurance.insurance
  // Updates the seller's balance
  var payment = compensatinginsurance.compensation
  insurance.insured.balance += payment
  // Check if the buyer has enough to pay the notary, real estate agent and insurance
  if( insurance.insuranceCompany.balance < payment ){
    throw new Error('Not enough funds to compensate this!')
  }
  insurance.insuranceCompany.balance -= payment
  Promise.all([
    getParticipantRegistry('org.acme.ipregistry.PrivateIndividual'),
    getParticipantRegistry('org.acme.ipregistry.InsuranceCompany')
  ]).then(function(registries){
    return (
      registries[0].update(insurance.insured),
      registries[1].update(insurance.insuranceCompany)
    )
  })
 }


/**
 * Contracting a loan
 * @param {org.acme.ipregistry.ContractingLoan} loan
 * @transaction
 */

function contractingLoan( loan ){
  return getAssetRegistry('org.acme.ipregistry.Loan')
    .then(function(assetRegistry){
    var factory = getFactory()
    var loanId = loan.debtor.id + '' + loan.ipEstate.id + '' + loan.bank.id
    var loanAsset = factory.newResource('org.acme.ipregistry', 'Loan', loanId) 
    loanAsset.debtor = loan.debtor
    loanAsset.bank = loan.bank
    loanAsset.interestRate = loan.interestRate
    loanAsset.durationInMonths = loan.durationInMonths
    loanAsset.ipEstate = loan.ipEstate
    loanAsset.amount = loan.ipEstate.price
    // loan.ipEstate.status = PLEDGE
    return assetRegistry.add(loanAsset)
  })
}

 /**
 * paying a loan
 * @param {org.acme.ipregistry.CompensatingLoan} payingloan
 * @transaction
 */

 function compensatingLoan( payingloan ){
  var loan = payingloan.loan
  // Updates the seller's balance
  var payment = payingloan.payment

  if( loan.debtor.balance < payment ){
    throw new Error('Not enough funds to pay this!')
  }
  loan.debtor.balance -= payment
  loan.bank.balance += payment
  Promise.all([
    getParticipantRegistry('org.acme.ipregistry.PrivateIndividual'),
    getParticipantRegistry('org.acme.ipregistry.Bank')
  ]).then(function(registries){
    return (
      registries[0].update(loan.debtor),
      registries[1].update(loan.bank)
    )
  })
 }

/**
 * submit patent report
 * @param {org.acme.ipregistry.SubmitIPReport} report
 * @transaction
 */

function submitIPReport(report){
  var ipID = report.ipID
  // Updates the seller's balance
  var ip = getIPByID(ipID)
  ip.price = report.value
  Promise.all([
    getParticipantRegistry('org.acme.ipregistry.IPEstate')
  ]).then(function(registries){
    return (
      registries[0].update(ip)
    )
  })
}

/*
 *是否存在该id的IP
 *
 */
function getIPFlag(ipflag) {
  return getAssetRegistry('org.acme.ipregistry.IPEstate')
    .then(function (assetRegistry) {
      return assetRegistry.exists(ipflag);
    });
}
/*
 *返回该id的IP
 *
 */
function getIPByID(ipflag) {
  return getAssetRegistry('org.acme.ipregistry.IPEstate')
    .then(function (assetRegistry) {
      return assetRegistry.get(ipflag);
    });
}


/*
 *是否存在该id的Loan
 *
 */
function getLoanFlag(loanflag) {
  return getAssetRegistry('org.acme.ipregistry.Loan')
    .then(function (assetRegistry) {
      return assetRegistry.exists(loanflag);
    });
}
/*
 *返回该id的Loan
 *
 */
function getLoanByID(loanflag) {
  return getAssetRegistry('org.acme.ipregistry.Loan')
    .then(function (assetRegistry) {
      return assetRegistry.get(loanflag);
    });
}
/*
 *是否存在该id的Insurance
 *
 */
function getInsuranceFlag(insuranceflag) {
  return getAssetRegistry('org.acme.ipregistry.Insurance')
    .then(function (assetRegistry) {
      return assetRegistry.exists(insuranceflag);
    });
}
/*
 *返回该id的Insurance
 *
 */
function getInsuranceByID(insuranceflag) {
  return getAssetRegistry('org.acme.ipregistry.Insurance')
    .then(function (assetRegistry) {
      return assetRegistry.get(insuranceflag);
    });
}

/*
 *是否存在该id的IPPool
 *
 */
function getIPPoolFlag(poolflag) {
  return getAssetRegistry('org.acme.ipregistry.IPPool')
    .then(function (assetRegistry) {
      return assetRegistry.exists(poolflag);
    });
}
/*
 *返回该id的IPPool
 *
 */
function getIPPoolByID(poolflag) {
  return getAssetRegistry('org.acme.ipregistry.IPPool')
    .then(function (assetRegistry) {
      return assetRegistry.get(poolflag);
    });
}






function getPrivateIndividualByID(id){
  return getParticipantRegistry('org.acme.ipregistry.PrivateIndividual')
    .then(function(participantRegistry){
        return participantRegistry.get(id);
    });
}

function getBankByID(id){
  return getParticipantRegistry('org.acme.ipregistry.Bank')
    .then(function(participantRegistry){
        return participantRegistry.get(id);
    });
}

function getIPEstateAgentByID(id){
  return getParticipantRegistry('org.acme.ipregistry.IPEstateAgent')
    .then(function(participantRegistry){
        return participantRegistry.get(id);
    });
}

function getInsuranceCompanyByID(id){
  return getParticipantRegistry('org.acme.ipregistry.InsuranceCompany')
    .then(function(participantRegistry){
        return participantRegistry.get(id);
    });
}

function getNotaryByID(id){
  return getParticipantRegistry('org.acme.ipregistry.Notary')
    .then(function(participantRegistry){
        return participantRegistry.get(id);
    });
}

