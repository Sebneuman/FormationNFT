"use client";
import Header from "./Header";
import Footer from "./Footer";
import { Flex } from "@chakra-ui/react";

const Layout = ({ children }) => {
  return (
    <Flex direction="column" minHeight="100vh">
        <Header />
        <Flex flexGrow="1" p="2rem" justifyContent="center" alignItems="center">
            {children}
        </Flex>
        <Footer />
    </Flex>
  )
}

export default Layout