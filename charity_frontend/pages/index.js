import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import Header from "../components/header";
import Donate from "../components/Donate";
import Register from "../components/Register";
import MoneyRequest from "../components/MoneyRequest";
import DistributeDonation from "../components/DistributeDonation";

export default function Home() {
  return (
    <div className={styles.container}>
      <Header />
      <Donate />
      <Register />
      <MoneyRequest />
      <DistributeDonation />
    </div>
  );
}
