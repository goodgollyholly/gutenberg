/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useRefEffect } from '@wordpress/compose';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Allows Zoom Out mode to be exited by double clicking in the selected block.
 */
export function useTemporarilyEditedBlocksExit() {
	const { getTemporarilyEditingAsBlocks } = unlock(
		useSelect( blockEditorStore )
	);
	const { stopEditingAsBlocks } = unlock( useDispatch( blockEditorStore ) );

	return useRefEffect(
		( node ) => {
			function onClick( event ) {
				const tempEditedClientId = getTemporarilyEditingAsBlocks();
				if ( ! tempEditedClientId ) {
					return;
				}

				if ( ! event.defaultPrevented ) {
					event.preventDefault();

					// If the user clicks outside the edited block, stop editing.
					if (
						! event.target.closest(
							`[data-block="${ tempEditedClientId }"]`
						)
					) {
						stopEditingAsBlocks();
					}
				}
			}

			node.addEventListener( 'click', onClick );

			return () => {
				node.removeEventListener( 'click', onClick );
			};
		},
		[ getTemporarilyEditingAsBlocks, stopEditingAsBlocks ]
	);
}
