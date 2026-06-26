// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedChainLedger {
    // Maps a record hash to the timestamp it was anchored
    mapping(bytes32 => uint256) public anchoredHashes;

    event HashAnchored(bytes32 indexed recordHash, uint256 timestamp);

    function anchorHash(bytes32 _hash) external {
        if (anchoredHashes[_hash] == 0) {
            anchoredHashes[_hash] = block.timestamp;
            emit HashAnchored(_hash, block.timestamp);
        }
    }

    function verifyHash(bytes32 _hash) external view returns (bool, uint256) {
        uint256 timestamp = anchoredHashes[_hash];
        return (timestamp > 0, timestamp);
    }
}
