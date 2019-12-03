
const getCards = async (cards, address) => {
    let seenCards = {}
    let events = await cards.getPastEvents('Transfer', { fromBlock: 8945000, toBlock: 'latest', filter: { to: [address] } })
    events = events.filter((event) => {
        if (seenCards[event.returnValues.tokenId.toString()]) {
            return false
        }
        seenCards[event.returnValues.tokenId.toString()] = true
        return true
    })
    let seenCardPromises = events.map(async (event) => { return await promisifyEvent(address, cards, event) })
    return (await Promise.all(seenCardPromises)).filter((card) => card !== undefined)
}

async function promisifyEvent(address, cards, event) {
    let id = event.returnValues.tokenId.toString()
    let owner = await cards.methods.ownerOf(id).call()
    if (owner.toLowerCase() === address.toLowerCase()) {
        let details = await cards.methods.getDetails(id).call()
        return { id, proto: details.proto, quality: details.quality }
    } else {
        return undefined
    }
}


export default getCards