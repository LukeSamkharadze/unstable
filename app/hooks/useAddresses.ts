import { useState, useEffect } from "react";
import type { Addresses } from "../types";

export const useAddresses = () => {
	const [addresses, setAddresses] = useState<Addresses>({});

	useEffect(() => {
		fetch("/api")
			.then((res) => res.json())
			.then((data) =>
				setAddresses({
					eoaWalletAddress: data.eoaWalletAddress,
					smartWalletAddress: data.smartWalletAddress,
				}),
			)
			.catch((error) => console.error("Error fetching addresses:", error));
	}, []);

	return addresses;
};
