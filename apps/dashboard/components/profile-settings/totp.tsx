// "use client";
// import React, { useState } from "react";
// import { Box, Button, Modal } from "@mui/joy";
// import { totpInitiateServerAction } from "./server-actions";
// import { useFormState, useFormStatus } from "react-dom";

// function EnableTotp() {
//   const [modalOpen, setModalOpen] = useState(false);
//   const [responseData, setResponseData] = useState({
//     error: false,
//     message: "null",
//     data: null,
//   });

//   const handleClick = async () => {
//     const response = await totpInitiateServerAction();
//     if (response.error || !response.data) {
//       return;
//     }
//     setResponseData(response?.data);
//   };

//   return (
//     <>
//       {responseData.message === "success" && (
//         <Modal
//           open={modalOpen}
//           onClose={() => setModalOpen(false)}
//           aria-labelledby="modal-modal-title"
//           aria-describedby="modal-modal-description"
//         >
//           <Box>{responseData.message}</Box>
//         </Modal>
//       )}
//       <Button loading={false} onClick={handleClick}></Button>
//     </>
//   );
// }

// export default EnableTotp;
