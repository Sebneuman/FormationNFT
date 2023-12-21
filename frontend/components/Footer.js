"use client";
import { Flex, Text } from "@chakra-ui/react";

const Footer = () => {
  return (
    <Flex h="15vh" p="2rem" justifyContent="center" alignItems="center">
        <Text>&copy; BBK {new Date().getFullYear()}</Text>
    </Flex>
  )
}

export default Footer