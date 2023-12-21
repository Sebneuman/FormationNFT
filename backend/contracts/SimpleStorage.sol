// SPDX-License-Identifier: MIT
pragma solidity 0.8.22;

contract SimpleStorage{
    uint256 nombre;

    function getNombre() external view returns(uint256){
        return nombre;
    }

    function setNombre(uint256 _nombre) external{
        nombre = _nombre;
    }
}