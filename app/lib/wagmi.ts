import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { robinhoodChain, ACTIVE_CHAIN } from "./chain";

export const wagmiConfig = createConfig({
  chains: [robinhoodChain],
  connectors: [injected()],
  transports: {
    [robinhoodChain.id]: http(),
  },
});