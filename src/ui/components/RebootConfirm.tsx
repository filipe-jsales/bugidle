import { visitRebootCenter } from "../../game/engine";
import { UI } from "../../i18n/ptBR";
import { useApp } from "../appContext";
import { store } from "../store";
import { Button, Icon, Modal } from "./primitives";

const P = UI.proximity;

/** Asks before leaving a fight for the Reboot Center: the fight's XP and coins are lost. */
export function RebootConfirm({ onClose }: { onClose: () => void }) {
  const { report } = useApp();
  return (
    <Modal title={P.rebootTitle} onClose={onClose}>
      <p className="reboot-confirm-text">{P.rebootText}</p>
      <div className="button-row wrap">
        <Button
          variant="purple"
          onClick={() => {
            report(store.run(visitRebootCenter));
            onClose();
          }}
        >
          <Icon name="reboot" size={14} /> {P.rebootConfirm}
        </Button>
        <Button variant="dark" onClick={onClose}>
          {P.rebootCancel}
        </Button>
      </div>
    </Modal>
  );
}
