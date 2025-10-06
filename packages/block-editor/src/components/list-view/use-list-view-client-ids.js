/**
 * WordPress dependencies
 */

import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function useListViewClientIds( { blocks, rootClientId } ) {
	return useSelect(
		( select ) => {
			const {
				getDraggedBlockClientIds,
				getSelectedBlockClientIds,
				getEnabledClientIdsTree,
				getTemporarilyEditingAsBlocks,
			} = unlock( select( blockEditorStore ) );

			const temporarilyEditedBlock = getTemporarilyEditingAsBlocks();

			return {
				selectedClientIds: getSelectedBlockClientIds(),
				draggedClientIds: getDraggedBlockClientIds(),
				clientIdsTree:
					blocks ?? temporarilyEditedBlock
						? getEnabledClientIdsTree(
								temporarilyEditedBlock,
								true /* include self in results */
						  )
						: getEnabledClientIdsTree( rootClientId ),
			};
		},
		[ blocks, rootClientId ]
	);
}
