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
	const { modifyContentLockBlock, stopEditingAsBlocks } = unlock(
		useDispatch( blockEditorStore )
	);
	const {
		attributes,
		isContentOnlyTemplateLocked,
		isTemporarilyEditedBlock,
	} = useSelect(
		( select ) => {
			const {
				getBlockAttributes,
				getTemporarilyEditingAsBlocks,
				getTemplateLock,
			} = unlock( select( blockEditorStore ) );

			return {
				attributes: getBlockAttributes( clientId ),
				isTemporarilyEditedBlock:
					getTemporarilyEditingAsBlocks() === clientId,
				isContentOnlyTemplateLocked:
					getTemplateLock( clientId ) === 'contentOnly',
			};
		},
		[ clientId ]
	);

	if (
		! attributes?.metadata?.patternName &&
		! isContentOnlyTemplateLocked &&
		! isTemporarilyEditedBlock
	) {
		return null;
	}

	return (
		<Button
			className="block-editor-block-inspector-edit-contents-button"
			__next40pxDefaultSize
			variant="secondary"
			onClick={ () => {
				if ( ! isTemporarilyEditedBlock ) {
					modifyContentLockBlock( clientId );
				} else {
					stopEditingAsBlocks();
				}
			} }
		>
			{ isTemporarilyEditedBlock
				? __( 'Finish editing' )
				: __( 'Edit design' ) }
		</Button>
	);
}
