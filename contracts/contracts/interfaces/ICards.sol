pragma solidity 0.5.12;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract ICards is IERC721 {

    struct Batch {
        uint48 userID;
        uint16 size;
    }

    function batches(uint index) public view returns (uint48 userID, uint16 size);

    function userIDToAddress(uint48 id) public view returns (address);

    function getDetails(
        uint tokenId
    )
        public
        view
        returns (
        uint16 proto,
        uint8 quality
    );

    function setQuality(
        uint tokenId,
        uint8 quality
    ) public;

    function mintCards(
        address to,
        uint16[] memory _protos,
        uint8[] memory _qualities
    )
        public
        returns (uint);

    function mintCard(
        address to,
        uint16 _proto,
        uint8 _quality
    )
        public
        returns (uint);

    function burn(uint tokenId) public;

    function batchSize()
        public
        view
        returns (uint);

    function transferAllFrom(
        address from,
        address to,
        uint256[] memory tokenIDs
    ) public;

    function setApprovalForAll(
        address to,
        bool approved
    ) public;

}
