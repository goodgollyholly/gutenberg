/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

export default function EditContentsButton( { clientId } ) {
	// Disable reason: it is an effect so can't move relocated to after
	// the if statement.
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return
	const { modifyContentLockBlock } = unlock(
		useDispatch( blockEditorStore )
	);
	const { attributes, editedClientId } = useSelect(
		( select ) => {
			const { getBlockAttributes, getTemporarilyEditingAsBlocks } =
				unlock( select( blockEditorStore ) );

			return {
				attributes: getBlockAttributes( clientId ),
				editedClientId: getTemporarilyEditingAsBlocks(),
			};
		},
		[ clientId ]
	);

	if (
		! attributes?.metadata?.patternName ||
		attributes?.templateLock === 'contentOnly'
	) {
		return null;
	}

	return (
		<Button
			className="block-editor-block-inspector-edit-contents-button"
			__next40pxDefaultSize
			variant="secondary"
			onClick={ () => {
				if ( ! editedClientId ) {
					modifyContentLockBlock( clientId );
				} else {
					modifyContentLockBlock();
				}
			} }
		>
			{ editedClientId ? __( 'Finish editing' ) : __( 'Edit layout' ) }
		</Button>
	);
}
