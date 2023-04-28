//SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OVRToken is Ownable, ERC20 {
    ///@notice constructor sets up token names and symbols for the RewardToken
    constructor(
        string memory _tokenName,
        string memory _tokenSymbol
    ) public ERC20(_tokenSymbol, _tokenName) {
        mint(msg.sender, 81688155000000000000000000); //mint deploying address the initial supply of tokens
    }

    /**
@notice mint is an only owner function that allows the owner to mint new tokens to an input account
@param _to is the address that will receive the new tokens
@param _amount is the amount of token they will receive
**/
    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    /**
@notice burn is an only owner function that allows the owner to burn  tokens from an input account
@param _from is the address where the tokens will be burnt
@param _amount is the amount of token to be burnt
**/
    function burn(address _from, uint256 _amount) public onlyOwner {
        _burn(_from, _amount);
    }
}
