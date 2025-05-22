import { Link, useNavigate, useParams } from "react-router-dom";

import Modal from "../UI/Modal.jsx";
import EventForm from "./EventForm.jsx";
import { useMutation, useQuery } from "@tanstack/react-query";
import { editEvent, fetchEvent, queryClient } from "../../utils/http.js";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";

export default function EditEvent() {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;

  const { data, isError, error, isPending } = useQuery({
    queryKey: ["events", id],
    queryFn: ({ signal }) => fetchEvent({ id, signal }),
  });

  const { mutate } = useMutation({
    mutationFn: editEvent,
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["events", id] });

      const previousData = queryClient.getQueryData(["events", id]);
      queryClient.setQueryData(["events", id], data.event);

      return { previousData };
    },

    onError: (error, variables, context) => {
      queryClient.setQueryData(["events", id], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events", id] });
    },
  });

  function handleSubmit(formData) {
    mutate({ id: id, event: formData });
    navigate("../");
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  if (isPending) {
    content = (
      <div className="center">
        <LoadingIndicator />
      </div>
    );
  }
  if (isError) {
    content = (
      <ErrorBlock
        title="error to load event"
        message={error.info?.message || "failed to load event details "}
      >
        <div className="form-actions">
          <Link to="../" className="button">
            Okay
          </Link>
        </div>
      </ErrorBlock>
    );
  }

  if (data) {
    content = (
      <EventForm inputData={data} onSubmit={handleSubmit}>
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>
      </EventForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}
