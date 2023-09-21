import { Blake2b } from '@iota/crypto.js';
import { Converter } from '@iota/util.js';
import { Buffer } from 'buffer';

import { nodeClient, selectedNetwork } from '$lib/evm-toolkit';
import { SimpleBufferCursor } from '$lib/simple-buffer-cursor';
import { waspAddrBinaryFromBech32 } from '$lib/withdraw';
import { get } from 'svelte/store';

export async function evmAddressToAgentID(evmStoreAccount: string): Promise<Uint8Array> {
  // This function constructs an AgentID that is required to be used with contracts
  // Wasp understands different AgentID types and each AgentID needs to provide a certain ID that describes it's address type.
  // In the case of EVM addresses it's ID 3.
  const agentIDKindEthereumAddress = 3;

  // Note: we need the evmStoreAccount to be in lower case, 
  // otherwise fetching balances using the iscmagic contract will fail,
  // because evm addresses are case-insensitive but hexToBytes is not.
  const receiverAddrBinary = Converter.hexToBytes(evmStoreAccount?.toLowerCase());

  const aliasAddressInBytes = await waspAddrBinaryFromBech32(get(nodeClient), get(selectedNetwork).chainAddress)

  const agentIdBytes = new Uint8Array([
    agentIDKindEthereumAddress,
    ...aliasAddressInBytes,
    ...receiverAddrBinary,
  ]);

  return agentIdBytes;
}

export function hNameFromString(name): number {
  const ScHNameLength = 4;
  const stringBytes = Converter.utf8ToBytes(name);
  const hash = Blake2b.sum256(stringBytes);

  for (let i = 0; i < hash.length; i += ScHNameLength) {
    const slice = hash.slice(i, i + ScHNameLength);
    const cursor = new SimpleBufferCursor(Buffer.from(slice));

    return cursor.readUInt32LE();
  }

  return 0;
}
