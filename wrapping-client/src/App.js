import React, { Component } from 'react'
import BigNumber from 'bignumber.js'

import ICards from './contracts/ICards.json'
import CardERC20Wrapper from './contracts/CardERC20Wrapper.json'
import CardERC20WrapperFactory from './contracts/CardERC20WrapperFactory.json'
import getWeb3 from './utils/getWeb3'
import getCards from './utils/getCards'

import guIcon from './images/guIcon.png'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'composited-card'
import './App.css'

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_DOWN })
const DECIMALS = BigNumber('1000000000000000000')

class App extends Component {
  state = {
    inputValue: BigNumber(0),
    cards: undefined,
    isWithdrawing: false,
    isApproved: false,
    isHovering: false,
    balance: null,
    web3: null,
    cardsContract: null,
    factoryContract: null,
    wrapperContract: null,
    lastInfrequentUpdate: 0
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3()
      // Get the contract instance.
      const networkId = await web3.eth.net.getId()
      const cardsContract = new web3.eth.Contract(
        ICards.abi,
        ICards.networks[networkId] && ICards.networks[networkId].address,
      )
      const factoryContract = new web3.eth.Contract(
        CardERC20WrapperFactory.abi,
        CardERC20WrapperFactory.networks[networkId] && CardERC20WrapperFactory.networks[networkId].address,
      )
      const wrapperContract = new web3.eth.Contract(
        CardERC20Wrapper.abi,
        await factoryContract.methods.getWrapperAddress(126, 4).call()
      )
      const isApproved = await this.fetchApproval(cardsContract, factoryContract, web3)
      const balance = await this.fetchBalance(wrapperContract, web3)
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      await this.setState({ web3, balance, isApproved, cardsContract, factoryContract, wrapperContract, networkId })
      const cards = await this.fetchCards(cardsContract, web3)
      await this.setState({ cards })
      await this.setupSubscriptions()
    } catch (error) {
      console.log(error)
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      )
    }
  }

  setupSubscriptions = async () => {
    const { web3 } = this.state
    web3.eth.subscribe('newBlockHeaders').on('data', async () => {
      const { cardsContract, wrapperContract, factoryContract, } = this.state
      const isApproved = await this.fetchApproval(cardsContract, factoryContract, web3)
      const balance = await this.fetchBalance(wrapperContract, web3)
      const cards = await this.fetchCards(cardsContract, web3)
      await this.setState({ isApproved, balance, cards })
    })

  }

  componentWillUnmount() {
    this.kill = true
  }

  tradeButtonClick = async () => {
    window.open('https://exchange.wrappedgu.com')
  }

  updateValue = async (e) => {
    const value = BigNumber(e.target.value)
    this.setState({ inputValue: value.toString() === 'NaN' ? 0 : value })
  }

  fetchCards = async (cardsContract, web3) => {
    const account = (await web3.eth.getAccounts())[0]
    if (account === undefined) {
      return []
    }
    const cards = (await getCards(cardsContract, account)).filter((card) => { return card.proto === 126 && card.quality === 4 })
    return cards
  }

  fetchApproval = async (cardsContract, factoryContract, web3) => {
    const account = (await web3.eth.getAccounts())[0]
    if (account === undefined) {
      return false
    }
    let isApproved = await cardsContract.methods.isApprovedForAll(account, factoryContract.address).call()
    return isApproved
  }

  fetchBalance = async (wrapperContract, web3) => {
    const account = (await web3.eth.getAccounts())[0]
    if (account === undefined) {
      return '0'
    }
    let balance = (await wrapperContract.methods.balanceOf(account).call()).toString()
    return balance
  }

  getGasPrice = async () => {
    const { web3 } = this.state
    const recommended = await web3.eth.getGasPrice()
    return BigNumber(recommended).multipliedBy(BigNumber('1.5')).toString()
  }


  withdraw = async () => {
    const { web3, cardsContract, wrapperContract, inputValue } = this.state
    await this.setState({ isWithdrawing: true })
    const account = (await web3.eth.getAccounts())[0]
    try {
      await wrapperContract.methods.burnTokensAndWithdrawCards(inputValue.toString(), account).send({ from: account, gasPrice: await this.getGasPrice() })
    } catch (e) { console.log(e) }
    await this.setState({ isWithdrawing: false, cards: await this.fetchCards(cardsContract, web3), balance: await this.fetchBalance(wrapperContract, web3) })
  }

  depositOrApprove = async () => {
    const { web3, cards, cardsContract, factoryContract, wrapperContract, inputValue, isApproved } = this.state
    if (!isApproved) {
      await this.setState({ isApproving: true })
    } else {
      await this.setState({ isDepositing: true })
    }
    const account = (await web3.eth.getAccounts())[0]
    try {
      if (isApproved) {
        await wrapperContract.methods.depositCardsAndMintTokens(cards.slice(0, inputValue).map((card) => card.id), account).send({ from: account, gasPrice: await this.getGasPrice() })
      } else {
        await cardsContract.methods.setApprovalForAll(factoryContract.address, true).send({ from: account, gasPrice: await this.getGasPrice() })
      }
    } catch (e) { console.log(e) }
    await this.setState({ isDepositing: false, isApproving: false, isApproved: await this.fetchApproval(cardsContract, factoryContract, web3), cards: await this.fetchCards(cardsContract, web3), balance: await this.fetchBalance(wrapperContract, web3) })
  }

  render() {
    if (!this.state.web3) {
      return <div></div>
    }
    return (

      <div className='App h-100'>
        <div className='container-fluid container-large d-flex h-100 flex-column'>
          <div className='row' style={{ backgroundColor: 'rgb(14,24,35)', padding: '0px', paddingTop: '10px' }}>
            <div className='col-6 d-flex justify-content-start' style={{ margin: '0px', marginBottom: '5px' }}>
              <img src={guIcon} alt='' style={{ width: '35px', height: '35px' }} />
              <p id='title'>WRAPPED GODS UNCHAINED </p>
            </div>
            <div className='col-6 d-flex justify-content-end'>
              <a id='learn-play' href='https://godsunchained.com/'>
                Built for Gods Unchained | Play here
              </a>
            </div>
          </div>
          <div className='row' style={{ marginTop: '10px' }}>
            <div className='col-10 offset-1' style={{ 'padding': '10px' }}>
              <div className='row'>

                <div className='col-lg-6'>
                  <div className='row'>
                    <div className='col-lg-12' align='center'>
                      <composited-card
                        protoId='126'
                        quality='4'
                        className='card'
                      />
                    </div>
                  </div>
                  <div className='row'>
                    <div className='col-6 offset-3' style={{ alignContent: 'center', marginTop: '75px' }}>
                      <div className='row' style={{ color: 'white', marginTop: '5px' }}>
                        <div className='col-6 set-max' onClick={this.updateValueToWalletBalance} >
                          Unwrapped Cards<br />
                          <span style={{ color: 'rgb(170, 170, 170)', fontFamily: 'PT Sans Narrow' }}>
                            {this.state.cards === undefined ? 'Loading...' : BigNumber(this.state.cards.length).toFixed(0)}</span>
                        </div>
                        <div className='col-6 set-max' onClick={this.updateValueToPoolBalance} >
                          Wrapped Cards<br />
                          <span style={{ color: 'rgb(170, 170, 170)', fontFamily: 'PT Sans Narrow' }}>
                            {BigNumber(this.state.balance).div(DECIMALS).toFixed(6)}</span>
                        </div>
                      </div>
                      <div className='row'>

                        <div className='col-12'>
                          <div className='row' style={{ marginTop: '25px' }}>
                            <div className='col-12'>
                              <div className='form-group'>
                                <input autoComplete="off" onKeyPress={function (event) { return (event.charCode === 8 || event.charCode === 0 || event.charCode === 13) ? null : event.charCode >= 48 && event.charCode <= 57 }} step='any' placeholder='Amount' type='number' className='form-control' id='amount' onChange={this.updateValue} />
                              </div>
                            </div>

                          </div>
                          <div className='row' >
                            <div className='col-6'>
                              <button title={this.state.isApproved ? 'Deposit cards to wrap them into fungible tokens' : 'Approve the wrapper to transfer cards on your behalf'} style={{ width: '100%', fontSize: '15px', padding: '2px' }} onClick={this.depositOrApprove} className='sc-htpNat lnMvqK' disabled={this.state.isWithdrawing || this.state.isDepositing || this.state.isApproving || (this.state.isApproved && (this.state.inputValue.toString() === '0' || (this.state.cards && BigNumber(this.state.cards.length).lt(this.state.inputValue))))}>
                                {this.state.isApproved ? (this.state.isDepositing ? 'DEPOSITTING' : 'DEPOSIT') : (this.state.isApproving ? 'APPROVING' : 'APPROVE')}
                              </button>

                            </div>
                            <div className='col-6'>
                              <button title='Withdraw cards by burning your wrapped tokens' style={{ width: '100%', fontSize: '15px', padding: '2px' }} onClick={this.withdraw} className='sc-htpNat lnMvqK' disabled={this.state.isWithdrawing || this.state.isDepositing || this.state.isApproving || this.state.inputValue.toString() === '0' || BigNumber(this.state.balance).div(DECIMALS).lt(this.state.inputValue)}>
                                {this.state.isWithdrawing ? 'WITHDRAWING' : 'WITHDRAW'}
                              </button>

                            </div>
                          </div>
                          <div className='row' style={{ marginTop: '25px' }}>

                            <div className='col-12'>
                              <button title='Opens the Wrapped GU Uniswap dapp' style={{ width: '100%', fontSize: '15px', padding: '2px' }} onClick={this.tradeButtonClick.bind(this)} className='sc-htpNat lnMvqK' >
                                BUY/SELL ON UNISWAP
                          </button>

                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
                <div className='col-lg-6 my-auto' style={{ textAlign: 'left', paddingTop: '50px' }}>
                  <strong>
                    <h1 className='header'>What is this<span style={{ color: 'rgb(67, 172, 241)', marginLeft: '5px', marginTop: '15px' }}>?</span></h1>
                    <p>Wrapped Gods Unchained is a website and set of smart contracts that allow you to trustlessly turn
                       non-fungible cards into a fungible (ERC20) version within their card and quality.
                    </p>
                    <h1 className='header'>How does it work<span style={{ color: 'rgb(67, 172, 241)', marginLeft: '5px', marginTop: '15px' }}>?</span></h1>
                    <p>It works by creating an ERC20 contract for a combination of proto and quality. For example, there would be separate
                      ERC20 contracts for A Real Man (Meteorite), A Real Man (Shadow), and Demogorgon (Meteorite). Anybody can mint tokens
                      on these ERC20 contracts by depositing cards of that contract's proto/quality, minting an equivalent number.
                      Anybody holding the ERC20 tokens can then burn said tokens to withdraw an equivalent number of the deposited cards.
                    </p>
                    <h1 className='header'>But why<span style={{ color: 'rgb(67, 172, 241)', marginLeft: '5px', marginTop: '15px' }}>?</span></h1>
                    <p>
                      Any number of wrapped cards can be traded for less than the cost of trading 1 unwrapped card. Since gas fees are lower,
                      lower value cards can be speculated on since the gas cost of buying a card doesn't need to be higher than the value of
                      the card itself. Since the ERC20 tokens representing the cards are divisible, you can also have partial ownership of cards,
                      which makes speculating on high value cards easier. On top of all that, since the cards become ERC20 tokens, they can be
                      traded on any traditional DEX, like Uniswap in this case.
                    </p>

                    <h1 className='header'>What's next<span style={{ color: 'rgb(67, 172, 241)', marginLeft: '5px' }}>?</span></h1>
                    <p>
                      The first priority is just finding if there is any interest in this, hence only supporting A Real Man to start. After that,
                      the main priorities are expanding the site to support any proto/quality, rich searching, on-site Uniswap trading, et el.
                    </p>
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div >
      </div >
    )
  }
}

export default App